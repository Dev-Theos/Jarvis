/// <reference types="vite/client" />

type JarvisAPI = {
  getBootstrap: () => Promise<{
    settings: import('./types').PublicSettings;
    history: import('./types').ChatMessage[];
    task: import('./types').TaskState | null;
    audit: import('./types').AuditEntry[];
    memories: import('./types').MemoryRecord[];
  }>;
  sendMessage: (
    text: string,
    fromVoice?: boolean,
  ) => Promise<import('./types').ChatMessage | null>;
  stop: () => Promise<import('./types').ChatMessage>;
  resolvePermission: (
    id: string,
    decision: import('./types').PermissionDecision,
  ) => Promise<boolean>;
  updateSettings: (
    patch: Record<string, unknown>,
  ) => Promise<import('./types').PublicSettings>;
  listMemories: (query?: string) => Promise<import('./types').MemoryRecord[]>;
  deleteMemory: (id: string) => Promise<boolean>;
  getAudit: () => Promise<import('./types').AuditEntry[]>;
  speak: (text: string) => Promise<string | null>;
  openPath: (target: string) => Promise<boolean>;
  onEvent: (handler: (event: import('./types').OrchestratorEvent) => void) => () => void;
};

declare global {
  interface Window {
    jarvis: JarvisAPI;
  }
}

export {};
