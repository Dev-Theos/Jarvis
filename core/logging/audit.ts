import { randomUUID } from 'node:crypto';
import type { AuditEntry } from '../types.js';

export type AuditListener = (entry: AuditEntry) => void;

export class AuditLog {
  private entries: AuditEntry[] = [];
  private listeners = new Set<AuditListener>();

  on(listener: AuditListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  record(kind: string, summary: string, detail?: string): AuditEntry {
    const entry: AuditEntry = {
      id: randomUUID(),
      at: new Date().toISOString(),
      kind,
      summary,
      detail,
    };
    this.entries.unshift(entry);
    if (this.entries.length > 500) this.entries.length = 500;
    for (const listener of this.listeners) listener(entry);
    return entry;
  }

  list(limit = 100): AuditEntry[] {
    return this.entries.slice(0, limit);
  }
}
