import { contextBridge, ipcRenderer } from 'electron';
import type {
  AuditEntry,
  ChatMessage,
  JarvisSettings,
  MemoryRecord,
  OrchestratorEvent,
  PermissionDecision,
  TaskState,
} from '../core/types.js';

export type PublicSettings = ReturnType<
  typeof import('../core/config/settings.js').publicSettings
>;

export interface Bootstrap {
  settings: PublicSettings;
  history: ChatMessage[];
  task: TaskState | null;
  audit: AuditEntry[];
  memories: MemoryRecord[];
}

const api = {
  getBootstrap: (): Promise<Bootstrap> => ipcRenderer.invoke('jarvis:getBootstrap'),
  sendMessage: (text: string, fromVoice = false): Promise<ChatMessage | null> =>
    ipcRenderer.invoke('jarvis:sendMessage', text, fromVoice),
  stop: (): Promise<ChatMessage> => ipcRenderer.invoke('jarvis:stop'),
  resolvePermission: (id: string, decision: PermissionDecision): Promise<boolean> =>
    ipcRenderer.invoke('jarvis:resolvePermission', id, decision),
  updateSettings: (patch: Partial<JarvisSettings>): Promise<PublicSettings> =>
    ipcRenderer.invoke('jarvis:updateSettings', patch),
  listMemories: (query?: string): Promise<MemoryRecord[]> =>
    ipcRenderer.invoke('jarvis:listMemories', query),
  deleteMemory: (id: string): Promise<boolean> => ipcRenderer.invoke('jarvis:deleteMemory', id),
  getAudit: (): Promise<AuditEntry[]> => ipcRenderer.invoke('jarvis:getAudit'),
  speak: (text: string): Promise<string | null> => ipcRenderer.invoke('jarvis:speak', text),
  openPath: (target: string): Promise<boolean> => ipcRenderer.invoke('jarvis:openPath', target),
  onEvent: (handler: (event: OrchestratorEvent) => void) => {
    const listener = (_: Electron.IpcRendererEvent, event: OrchestratorEvent) => handler(event);
    ipcRenderer.on('jarvis:event', listener);
    return () => ipcRenderer.removeListener('jarvis:event', listener);
  },
};

contextBridge.exposeInMainWorld('jarvis', api);

export type JarvisAPI = typeof api;
