import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import {
  DEFAULT_SETTINGS,
  durableSettings,
  mergeSettings,
  publicSettings,
} from '../config/settings.js';
import { AuditLog } from '../logging/audit.js';
import { MemoryStore } from '../memory/store.js';
import { PermissionGate } from '../permissions/gate.js';
import { buildSystemPrompt, LOCAL_FALLBACK_REPLIES } from '../personality/prompt.js';
import { MultiProviderLLM } from '../router/llm.js';
import { analyzeIntent, selectModel } from '../router/router.js';
import { scrubSecrets } from '../security/scrub.js';
import { buildDefaultToolRegistry } from '../tools/index.js';
import type {
  ChatMessage,
  JarvisSettings,
  OrchestratorEvent,
  PermissionDecision,
  TaskState,
} from '../types.js';
import { FishAudioTTS, type TTSProvider } from '../voice/tts.js';
import { matchesWakePhrase, stripWakePhrase } from '../voice/wake.js';

export interface JarvisPaths {
  userDataDir: string;
  workspaceRoot: string;
  dbPath: string;
  settingsPath: string;
}

export type EventHandler = (event: OrchestratorEvent) => void;

export class Orchestrator {
  readonly memory: MemoryStore;
  readonly audit = new AuditLog();
  readonly permissions = new PermissionGate();
  readonly tools;
  private settings: JarvisSettings;
  private llm: MultiProviderLLM;
  private tts: TTSProvider;
  private history: ChatMessage[] = [];
  private listeners = new Set<EventHandler>();
  private abort: AbortController = new AbortController();
  private task: TaskState | null = null;
  private paths: JarvisPaths;

  constructor(paths: JarvisPaths, initial?: Partial<JarvisSettings>) {
    this.paths = paths;
    fs.mkdirSync(paths.userDataDir, { recursive: true });
    fs.mkdirSync(paths.workspaceRoot, { recursive: true });
    this.settings = mergeSettings(DEFAULT_SETTINGS, {
      ...this.loadSettingsFile(),
      ...initial,
    });
    this.memory = new MemoryStore(paths.dbPath);
    this.tools = buildDefaultToolRegistry(this.memory);
    this.llm = new MultiProviderLLM(() => this.settings);
    this.tts = new FishAudioTTS(
      () => this.settings.fishApiKey,
      () => this.settings.fishReferenceId,
    );
    this.audit.on((entry) => this.emit({ type: 'audit', entry }));
  }

  on(handler: EventHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  getPublicSettings() {
    return publicSettings(this.settings);
  }

  /** Full in-memory settings including secrets — main process only. */
  getSettings(): JarvisSettings {
    return { ...this.settings };
  }

  updateSettings(patch: Partial<JarvisSettings>) {
    const cleaned = { ...patch };
    // Ignore UI placeholder markers
    if (cleaned.llmApiKey === '***') delete cleaned.llmApiKey;
    if (cleaned.anthropicApiKey === '***') delete cleaned.anthropicApiKey;
    if (cleaned.openRouterApiKey === '***') delete cleaned.openRouterApiKey;
    if (cleaned.fishApiKey === '***') delete cleaned.fishApiKey;
    this.settings = mergeSettings(this.settings, cleaned);
    this.saveSettingsFile();
    this.audit.record('settings', 'Settings updated');
    return this.getPublicSettings();
  }

  getHistory() {
    return [...this.history];
  }

  getTask() {
    return this.task;
  }

  listAudit(limit = 100) {
    return this.audit.list(limit);
  }

  resolvePermission(id: string, decision: PermissionDecision) {
    const ok = this.permissions.resolve(id, decision);
    if (ok) this.emit({ type: 'permission_resolved', id, decision });
    this.audit.record('permission', `Decision ${decision} for ${id}`);
    return ok;
  }

  async deleteMemory(id: string): Promise<boolean> {
    const record = this.memory.get(id);
    if (!record) return false;
    const allowed = await this.askToolPermission(
      'memory_forget',
      'confirm',
      `Delete memory “${record.title}”?`,
      record.content,
    );
    if (!allowed) return false;
    const ok = this.memory.forget(id);
    if (ok) this.audit.record('memory', `Deleted ${id}`);
    return ok;
  }

  stop() {
    this.abort.abort();
    this.abort = new AbortController();
    if (this.task && this.task.status === 'running') {
      this.task = {
        ...this.task,
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      };
      this.emit({ type: 'task', task: this.task });
    }
    this.emit({ type: 'stopped' });
    this.audit.record('stop', 'Emergency stop');
    const msg = this.pushAssistant(LOCAL_FALLBACK_REPLIES.stopped());
    return msg;
  }

  async handleUserText(rawText: string, opts?: { fromVoice?: boolean }) {
    let text = rawText.trim();
    if (!text) return null;

    if (opts?.fromVoice && matchesWakePhrase(text, this.settings.wakePhrases)) {
      text = stripWakePhrase(text, this.settings.wakePhrases) || text;
    }

    if (/^(stop|cancel|halt)(\s+jarvis)?[.!?]?$/i.test(text)) {
      return this.stop();
    }

    this.pushUser(text);
    this.audit.record('user', scrubSecrets(text).slice(0, 200));

    const analysis = analyzeIntent(text);
    const choice = selectModel(analysis, this.settings);

    this.task = {
      id: randomUUID(),
      title: analysis.summary,
      status: 'running',
      steps: [
        { id: randomUUID(), title: 'Analyze intent', status: 'done', detail: analysis.summary },
        { id: randomUUID(), title: 'Select model', status: 'done', detail: `${choice.provider}/${choice.model}` },
        { id: randomUUID(), title: 'Execute', status: 'running' },
      ],
      updatedAt: new Date().toISOString(),
    };
    this.emit({ type: 'task', task: this.task });

    try {
      const reply = await this.executeTurn(text, analysis.intent, choice.provider === 'local');
      this.completeTask('done');
      const message = this.pushAssistant(reply);
      if (this.settings.voiceOutputEnabled) {
        this.emit({ type: 'speak', text: reply });
      }
      return message;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.completeTask('failed', error);
      return this.pushAssistant(`I hit a problem, ${this.settings.userAddress}: ${scrubSecrets(error)}`);
    }
  }

  async synthesizeSpeech(text: string): Promise<Buffer | null> {
    if (!this.settings.voiceOutputEnabled) return null;
    if (!this.tts.isConfigured()) {
      this.emit({ type: 'voice_status', status: 'tts_unconfigured' });
      return null;
    }
    this.emit({ type: 'voice_status', status: 'speaking' });
    try {
      const audio = await this.tts.synthesize(text, this.abort.signal);
      this.emit({ type: 'voice_status', status: 'idle' });
      return audio;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.emit({ type: 'voice_status', status: `tts_error: ${scrubSecrets(msg)}` });
      return null;
    }
  }

  dispose() {
    this.memory.close();
  }

  private async executeTurn(text: string, intent: string, localOnly: boolean): Promise<string> {
    // Deterministic local handlers for core memory / project flows
    if (/what do you (know|remember)|recall|memory about|\bforget\b/i.test(text) === false && /\bremember\b/i.test(text)) {
      return this.localRemember(text);
    }
    if (/\bforget\b/i.test(text)) {
      return this.localForget(text);
    }
    if (/what do you (know|remember)|recall|memory about/i.test(text)) {
      return this.localRecall(text);
    }
    if (/build (me )?(a )?coffee website|coffee (shop )?site/i.test(text)) {
      return this.localBuildCoffeeSite();
    }
    if (/book .+reservation|reservation at/i.test(text)) {
      return this.localReservationFlow(text);
    }

    if (localOnly) {
      if (/^(hi|hello|hey)\b/i.test(text)) {
        return LOCAL_FALLBACK_REPLIES.greeting(this.settings.userAddress);
      }
      return LOCAL_FALLBACK_REPLIES.noModel(this.settings.userAddress);
    }

    const memoryBlock = this.memory.contextBlock(text);
    const system = buildSystemPrompt(this.settings, memoryBlock);
    const messages = [
      { role: 'system' as const, content: system },
      ...this.history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-12)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const analysis = analyzeIntent(text);
    const choice = selectModel(analysis, this.settings);
    this.emit({
      type: 'tool_activity',
      name: 'llm',
      status: `${choice.provider}:${choice.model}`,
    });
    const reply = await this.llm.complete(messages, choice);

    // Lightweight auto-memory suggestion for explicit facts (optional write already handled above)
    if (intent === 'chat' && /\bmy name is\b/i.test(text)) {
      const m = text.match(/\bmy name is\s+([A-Z][\w'-]+)/i);
      if (m) {
        this.memory.remember({
          type: 'preference',
          title: 'User name',
          content: `User's name is ${m[1]}`,
          tags: 'identity',
        });
      }
    }

    return reply;
  }

  private async localRemember(text: string): Promise<string> {
    const content = text.replace(/^.*?\bremember\b[:\s]*/i, '').trim() || text;
    const record = this.memory.remember({
      type: 'fact',
      title: content.slice(0, 60),
      content,
      tags: 'user',
    });
    this.emit({
      type: 'notification',
      title: 'Memory saved',
      body: record.title,
    });
    return `Got it, ${this.settings.userAddress}. I'll remember: ${record.content}`;
  }

  private async localForget(text: string): Promise<string> {
    const query = text.replace(/^.*?\bforget\b[:\s]*/i, '').trim();
    const matches = this.memory.search(query || text, 10);
    if (!matches.length) return `I don't have anything matching that, ${this.settings.userAddress}.`;

    const allowed = await this.askToolPermission(
      'memory_forget',
      'confirm',
      `Forget ${matches.length} memor${matches.length === 1 ? 'y' : 'ies'}?`,
      matches.map((m) => `${m.title}: ${m.content}`).join('\n'),
    );
    if (!allowed) return 'Understood — I left those memories alone.';

    for (const m of matches) this.memory.forget(m.id);
    return `Forgotten, ${this.settings.userAddress}. Removed ${matches.length} entr${matches.length === 1 ? 'y' : 'ies'}.`;
  }

  private async localRecall(text: string): Promise<string> {
    const query = text
      .replace(/.*\b(?:about|regarding)\b/i, '')
      .replace(/what do you (know|remember)/i, '')
      .trim() || text;
    const rows = this.memory.search(query, 8);
    if (!rows.length) {
      return `I don't have anything stored about that yet, ${this.settings.userAddress}.`;
    }
    return `Here's what I remember:\n${rows.map((r) => `• ${r.title}: ${r.content}`).join('\n')}`;
  }

  private async localBuildCoffeeSite(): Promise<string> {
    this.emit({ type: 'tool_activity', name: 'code_project_scaffold', status: 'requesting' });
    const result = await this.tools.run(
      'code_project_scaffold',
      { name: 'coffee-site', kind: 'coffee' },
      {
        workspaceRoot: this.paths.workspaceRoot,
        abortSignal: this.abort.signal,
        askPermission: async (level, summary, details) =>
          this.askToolPermission('code_project_scaffold', level, summary, details),
      },
    );
    this.emit({
      type: 'tool_activity',
      name: 'code_project_scaffold',
      status: result.ok ? 'done' : 'failed',
    });
    if (!result.ok) {
      return `I couldn't finish the site, ${this.settings.userAddress}: ${result.output}`;
    }
    const data = result.data as { path?: string; dir?: string } | undefined;
    return `Alright, ${this.settings.userAddress}. Working on it… And done. Coffee site is at ${data?.path ?? result.output}. Open that HTML file in your browser to view it.`;
  }

  private async localReservationFlow(text: string): Promise<string> {
    const missing: string[] = [];
    if (!/\b\d{1,2}\s*(am|pm)\b/i.test(text) && !/\b\d{1,2}:\d{2}\b/.test(text)) {
      missing.push('time');
    }
    // date & party size usually missing from the example phrasing
    if (!/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[\/\-]\d{1,2})\b/i.test(text)) {
      missing.push('date');
    }
    if (!/\bfor\s+\d+\b/i.test(text) && !/\bparty of\s+\d+\b/i.test(text)) {
      missing.push('party size');
    }

    const placeMatch = text.match(/at\s+(.+?)\s+for\b/i) || text.match(/at\s+(.+)$/i);
    const place = placeMatch?.[1]?.replace(/\s+for\s+.*/i, '').trim() || 'the restaurant';

    if (missing.length) {
      return `Of course, ${this.settings.userAddress}. Before I contact ${place}, I still need: ${missing.join(', ')}. Also — placing a live call or booking requires your approval, and telephony booking tools arrive in a later phase. I will not invent a successful booking.`;
    }

    return `I can research ${place} and outline booking options, ${this.settings.userAddress}, but I will not invent availability. Live calling/booking needs your approval and a connected communications provider (Phase 5). Shall I fetch the restaurant's public booking page next?`;
  }

  private async askToolPermission(
    tool: string,
    level: 'safe' | 'confirm' | 'high_risk',
    summary: string,
    details: string,
  ): Promise<boolean> {
    if (this.task) {
      this.task = {
        ...this.task,
        status: 'awaiting_permission',
        updatedAt: new Date().toISOString(),
      };
      this.emit({ type: 'task', task: this.task });
    }
    const decision = await this.permissions.request(tool, level, summary, details, (request) => {
      this.emit({ type: 'permission_request', request });
      this.emit({ type: 'speak', text: summary });
    });
    if (this.task && this.task.status === 'awaiting_permission') {
      this.task = {
        ...this.task,
        status: 'running',
        updatedAt: new Date().toISOString(),
      };
      this.emit({ type: 'task', task: this.task });
    }
    return decision === 'allow' || decision === 'allow_session';
  }

  private completeTask(status: TaskState['status'], detail?: string) {
    if (!this.task) return;
    const steps = this.task.steps.map((s) =>
      s.status === 'running'
        ? { ...s, status: status === 'done' ? 'done' as const : status === 'cancelled' ? 'cancelled' as const : 'failed' as const, detail }
        : s,
    );
    this.task = {
      ...this.task,
      status,
      steps,
      updatedAt: new Date().toISOString(),
    };
    this.emit({ type: 'task', task: this.task });
  }

  private pushUser(content: string) {
    const message: ChatMessage = {
      id: randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    this.history.push(message);
    this.emit({ type: 'message', message });
    return message;
  }

  private pushAssistant(content: string) {
    const message: ChatMessage = {
      id: randomUUID(),
      role: 'assistant',
      content,
      createdAt: new Date().toISOString(),
    };
    this.history.push(message);
    this.emit({ type: 'message', message });
    this.audit.record('assistant', scrubSecrets(content).slice(0, 200));
    return message;
  }

  private emit(event: OrchestratorEvent) {
    for (const listener of this.listeners) listener(event);
  }

  private loadSettingsFile(): Partial<JarvisSettings> {
    try {
      if (!fs.existsSync(this.paths.settingsPath)) return {};
      return JSON.parse(fs.readFileSync(this.paths.settingsPath, 'utf8')) as Partial<JarvisSettings>;
    } catch {
      return {};
    }
  }

  private saveSettingsFile() {
    // Never write raw API keys to the plaintext settings JSON.
    fs.writeFileSync(
      this.paths.settingsPath,
      JSON.stringify(durableSettings(this.settings), null, 2),
      'utf8',
    );
  }
}
