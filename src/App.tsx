import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AuditEntry,
  ChatMessage,
  MemoryRecord,
  ModelPreference,
  OrchestratorEvent,
  PermissionRequest,
  PublicSettings,
  TaskState,
} from './types';
import { Conversation } from './components/Conversation';
import { Composer } from './components/Composer';
import { HudOrb } from './components/HudOrb';
import { MemoryPanel } from './components/MemoryPanel';
import { PermissionModal } from './components/PermissionModal';
import { SideRail } from './components/SideRail';
import { SettingsPanel } from './components/SettingsPanel';
import './styles/app.css';

type Panel = 'none' | 'memory' | 'settings' | 'logs';

export default function App() {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [task, setTask] = useState<TaskState | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [permission, setPermission] = useState<PermissionRequest | null>(null);
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [toolActivity, setToolActivity] = useState('—');
  const [notification, setNotification] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('none');
  const [busy, setBusy] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSpeech = useCallback(async (text: string) => {
    if (!window.jarvis) return;
    const b64 = await window.jarvis.speak(text);
    if (!b64) return;
    const url = `data:audio/mpeg;base64,${b64}`;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    void audioRef.current.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!window.jarvis) {
      setSettings({
        wakePhrases: ['jarvis'],
        userAddress: 'sir',
        voiceOutputEnabled: true,
        modelPreference: 'auto',
        llmBaseUrl: 'https://api.openai.com/v1',
        cheapModel: 'gpt-4o-mini',
        standardModel: 'gpt-4o-mini',
        strongModel: 'gpt-4o',
        strongestModel: 'gpt-4o',
        anthropicModel: 'claude-sonnet-4-20250514',
        openRouterModel: 'openai/gpt-4o-mini',
        hasLlmKey: false,
        hasAnthropicKey: false,
        hasOpenRouterKey: false,
        hasFishKey: false,
        fishReferenceId: '',
      });
      setMessages([
        {
          id: 'preview',
          role: 'assistant',
          content: 'UI preview mode. Launch with Electron (`npm run dev`) for the full assistant.',
          createdAt: new Date().toISOString(),
        },
      ]);
      setReady(true);
      return;
    }
    void window.jarvis.getBootstrap().then((boot) => {
      setSettings(boot.settings);
      setMessages(boot.history);
      setTask(boot.task);
      setAudit(boot.audit);
      setMemories(boot.memories);
      setReady(true);
    });
    const off = window.jarvis.onEvent((event: OrchestratorEvent) => {
      switch (event.type) {
        case 'message':
          setMessages((prev) => [...prev, event.message]);
          break;
        case 'task':
          setTask(event.task);
          break;
        case 'permission_request':
          setPermission(event.request);
          break;
        case 'permission_resolved':
          setPermission((p) => (p?.id === event.id ? null : p));
          break;
        case 'audit':
          setAudit((prev) => [event.entry, ...prev].slice(0, 200));
          break;
        case 'notification':
          setNotification(`${event.title}: ${event.body}`);
          setTimeout(() => setNotification(null), 4000);
          void window.jarvis.listMemories().then(setMemories);
          break;
        case 'voice_status':
          setVoiceStatus(event.status);
          break;
        case 'tool_activity':
          setToolActivity(`${event.name} · ${event.status}`);
          break;
        case 'speak':
          void playSpeech(event.text);
          break;
        case 'stopped':
          setBusy(false);
          setVoiceStatus('stopped');
          audioRef.current?.pause();
          break;
      }
    });
    return off;
  }, [playSpeech]);

  async function send(text: string, fromVoice = false) {
    if (!text.trim() || !window.jarvis) return;
    setBusy(true);
    try {
      await window.jarvis.sendMessage(text, fromVoice);
      const mem = await window.jarvis.listMemories();
      setMemories(mem);
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    audioRef.current?.pause();
    await window.jarvis?.stop();
    setBusy(false);
  }

  async function selectModel(pref: ModelPreference) {
    setSettings((prev) => (prev ? { ...prev, modelPreference: pref } : prev));
    if (!window.jarvis) return;
    const patch: Record<string, unknown> = { modelPreference: pref };
    if (pref.startsWith('openrouter:')) {
      patch.openRouterModel = pref.slice('openrouter:'.length);
    }
    const next = await window.jarvis.updateSettings(patch);
    setSettings(next);
  }

  if (!ready) {
    return (
      <div className="boot">
        <div className="boot__brand">JARVIS</div>
        <p>Initializing systems…</p>
      </div>
    );
  }

  const browserPreview = !window.jarvis;

  return (
    <div className="shell">
      <div className="shell__glow" aria-hidden />
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__mark">J</span>
          <div>
            <h1>JARVIS</h1>
            <p>Unified personal assistant · Phase 1</p>
          </div>
        </div>
        <div className="topbar__actions">
          <button type="button" className="ghost" onClick={() => setPanel(panel === 'memory' ? 'none' : 'memory')}>
            Memory
          </button>
          <button type="button" className="ghost" onClick={() => setPanel(panel === 'logs' ? 'none' : 'logs')}>
            Logs
          </button>
          <button type="button" className="ghost" onClick={() => setPanel(panel === 'settings' ? 'none' : 'settings')}>
            Settings
          </button>
          <button type="button" className="danger" onClick={() => void stop()}>
            Emergency Stop
          </button>
        </div>
      </header>

      <main className="stage">
        <section className="hero-col">
          <HudOrb active={busy || voiceStatus === 'speaking'} />
          <p className="hero-tagline">At your service.</p>
          {notification && <div className="toast">{notification}</div>}
          {browserPreview && (
            <p className="preview-note">
              UI preview mode — run <code>npm run dev</code> for the full Electron assistant.
            </p>
          )}
        </section>

        <section className="chat-col">
          <Conversation messages={messages} />
          <Composer
            disabled={Boolean(permission)}
            onSend={(t) => void send(t)}
            onVoice={(t) => void send(t, true)}
            wakePhrases={settings?.wakePhrases ?? ['jarvis']}
          />
        </section>

        <SideRail
          voiceStatus={voiceStatus}
          toolActivity={toolActivity}
          task={task}
          settings={settings}
          onSelectModel={(pref) => void selectModel(pref)}
        />
      </main>

      {panel === 'memory' && (
        <MemoryPanel
          memories={memories}
          onClose={() => setPanel('none')}
          onRefresh={() => void window.jarvis?.listMemories().then(setMemories)}
          onDelete={(id) =>
            void window.jarvis?.deleteMemory(id).then((ok) => {
              if (ok) void window.jarvis.listMemories().then(setMemories);
            })
          }
        />
      )}
      {panel === 'settings' && settings && (
        <SettingsPanel
          settings={settings}
          onClose={() => setPanel('none')}
          onSave={async (patch) => {
            if (!window.jarvis) return;
            const next = await window.jarvis.updateSettings(patch);
            setSettings(next);
          }}
        />
      )}
      {panel === 'logs' && (
        <aside className="drawer">
          <div className="drawer__head">
            <h2>Audit log</h2>
            <button type="button" className="ghost" onClick={() => setPanel('none')}>
              Close
            </button>
          </div>
          <ul className="log-list">
            {audit.map((e) => (
              <li key={e.id}>
                <time>{new Date(e.at).toLocaleTimeString()}</time>
                <strong>{e.kind}</strong>
                <span>{e.summary}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {permission && (
        <PermissionModal
          request={permission}
          onDecide={(decision) => {
            void window.jarvis.resolvePermission(permission.id, decision);
            setPermission(null);
          }}
        />
      )}
    </div>
  );
}
