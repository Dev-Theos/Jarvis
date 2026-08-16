export type PermissionLevel = 'safe' | 'confirm' | 'high_risk';

export type MemoryType =
  | 'preference'
  | 'fact'
  | 'project'
  | 'contact'
  | 'episode'
  | 'instruction';

export interface MemoryRecord {
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface PermissionRequest {
  id: string;
  tool: string;
  level: PermissionLevel;
  summary: string;
  details: string;
  createdAt: string;
}

export type PermissionDecision = 'allow' | 'deny' | 'allow_session';

export interface ToolResult {
  ok: boolean;
  output: string;
  data?: unknown;
}

export interface IntentAnalysis {
  intent: string;
  domain: string;
  difficulty: number;
  risk: PermissionLevel;
  neededTools: string[];
  summary: string;
}

export interface ModelChoice {
  tier: 'cheap' | 'standard' | 'strong' | 'strongest' | 'local';
  provider: 'openai_compatible' | 'anthropic' | 'local';
  model: string;
  reason: string;
}

export interface TaskStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
  detail?: string;
}

export interface TaskState {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'awaiting_permission' | 'done' | 'failed' | 'cancelled';
  steps: TaskStep[];
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  kind: string;
  summary: string;
  detail?: string;
}

export interface JarvisSettings {
  wakePhrases: string[];
  userAddress: string;
  voiceOutputEnabled: boolean;
  llmApiKey: string;
  llmBaseUrl: string;
  cheapModel: string;
  standardModel: string;
  strongModel: string;
  strongestModel: string;
  anthropicApiKey: string;
  anthropicModel: string;
  fishApiKey: string;
  fishReferenceId: string;
}

export type OrchestratorEvent =
  | { type: 'message'; message: ChatMessage }
  | { type: 'task'; task: TaskState }
  | { type: 'permission_request'; request: PermissionRequest }
  | { type: 'permission_resolved'; id: string; decision: PermissionDecision }
  | { type: 'audit'; entry: AuditEntry }
  | { type: 'notification'; title: string; body: string }
  | { type: 'voice_status'; status: string }
  | { type: 'tool_activity'; name: string; status: string }
  | { type: 'speak'; text: string }
  | { type: 'stopped' };
