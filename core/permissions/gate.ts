import { randomUUID } from 'node:crypto';
import type {
  PermissionDecision,
  PermissionLevel,
  PermissionRequest,
} from '../types.js';

export interface PendingPermission {
  request: PermissionRequest;
  resolve: (decision: PermissionDecision) => void;
}

export class PermissionGate {
  private sessionAllows = new Set<string>();
  private pending = new Map<string, PendingPermission>();
  private timeoutMs: number;

  constructor(timeoutMs = 120_000) {
    this.timeoutMs = timeoutMs;
  }

  allowSession(tool: string): void {
    this.sessionAllows.add(tool);
  }

  clearSession(): void {
    this.sessionAllows.clear();
  }

  isSessionAllowed(tool: string): boolean {
    return this.sessionAllows.has(tool);
  }

  async request(
    tool: string,
    level: PermissionLevel,
    summary: string,
    details: string,
    onRequest: (req: PermissionRequest) => void,
  ): Promise<PermissionDecision> {
    if (level === 'safe') return 'allow';
    if (this.sessionAllows.has(tool) && level === 'confirm') return 'allow';

    const request: PermissionRequest = {
      id: randomUUID(),
      tool,
      level,
      summary,
      details,
      createdAt: new Date().toISOString(),
    };

    return new Promise<PermissionDecision>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(request.id);
        resolve('deny');
      }, this.timeoutMs);

      this.pending.set(request.id, {
        request,
        resolve: (decision) => {
          clearTimeout(timer);
          if (decision === 'allow_session') this.sessionAllows.add(tool);
          this.pending.delete(request.id);
          resolve(decision === 'allow_session' ? 'allow' : decision);
        },
      });
      onRequest(request);
    });
  }

  resolve(id: string, decision: PermissionDecision): boolean {
    const pending = this.pending.get(id);
    if (!pending) return false;
    pending.resolve(decision);
    return true;
  }

  listPending(): PermissionRequest[] {
    return [...this.pending.values()].map((p) => p.request);
  }
}

const DESTRUCTIVE_SHELL =
  /\b(rm\s+-rf|del\s+\/s|format\s+|mkfs|dd\s+if=|shutdown|reboot|Remove-Item\s+-Recurse)\b/i;

export function classifyShellPermission(command: string): PermissionLevel {
  if (DESTRUCTIVE_SHELL.test(command)) return 'high_risk';
  return 'confirm';
}
