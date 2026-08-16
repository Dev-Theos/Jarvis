export type PublicSettings = {
  wakePhrases: string[];
  userAddress: string;
  voiceOutputEnabled: boolean;
  llmBaseUrl: string;
  cheapModel: string;
  standardModel: string;
  strongModel: string;
  strongestModel: string;
  anthropicModel: string;
  hasLlmKey: boolean;
  hasAnthropicKey: boolean;
  hasFishKey: boolean;
  fishReferenceId: string;
};

export type PermissionLevel = 'safe' | 'confirm' | 'high_risk';
export type PermissionDecision = 'allow' | 'deny' | 'allow_session';

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
