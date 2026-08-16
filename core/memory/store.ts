import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { MemoryRecord, MemoryType } from '../types.js';

/**
 * Local persistent memory backed by a JSON file.
 * Avoids Electron/Node sqlite builtin differences so the desktop app boots reliably.
 */
export class MemoryStore {
  private filePath: string;
  private records: MemoryRecord[] = [];

  constructor(dbPath: string) {
    // Keep the same path convention from callers (*.db) but persist JSON beside it.
    this.filePath = dbPath.endsWith('.db')
      ? dbPath.replace(/\.db$/i, '.json')
      : `${dbPath}.json`;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    this.load();
  }

  remember(input: {
    type: MemoryType;
    title: string;
    content: string;
    tags?: string;
  }): MemoryRecord {
    const now = new Date().toISOString();
    const record: MemoryRecord = {
      id: randomUUID(),
      type: input.type,
      title: input.title.trim(),
      content: input.content.trim(),
      tags: (input.tags ?? '').trim(),
      createdAt: now,
      updatedAt: now,
    };
    this.records.unshift(record);
    this.save();
    return record;
  }

  update(
    id: string,
    patch: Partial<Pick<MemoryRecord, 'title' | 'content' | 'tags' | 'type'>>,
  ): MemoryRecord | null {
    const existing = this.get(id);
    if (!existing) return null;
    const updated: MemoryRecord = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.records = this.records.map((r) => (r.id === id ? updated : r));
    this.save();
    return updated;
  }

  get(id: string): MemoryRecord | null {
    return this.records.find((r) => r.id === id) ?? null;
  }

  forget(id: string): boolean {
    const before = this.records.length;
    this.records = this.records.filter((r) => r.id !== id);
    if (this.records.length === before) return false;
    this.save();
    return true;
  }

  forgetMatching(query: string): MemoryRecord[] {
    const matches = this.search(query, 20);
    for (const m of matches) this.forget(m.id);
    return matches;
  }

  search(query: string, limit = 8): MemoryRecord[] {
    const q = query.trim();
    if (!q) return this.list(limit);

    const tokens = q
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9_-]/g, ''))
      .filter((t) => t.length > 1);

    return this.records
      .map((record) => {
        const hay = `${record.title} ${record.content} ${record.tags}`.toLowerCase();
        let score = 0;
        if (hay.includes(q.toLowerCase())) score += 10;
        for (const token of tokens) {
          if (hay.includes(token)) score += 2;
        }
        return { record, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.record);
  }

  list(limit = 50): MemoryRecord[] {
    return this.records
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  }

  contextBlock(query: string, limit = 6): string {
    const rows = this.search(query, limit);
    if (!rows.length) return '';
    return rows.map((r) => `- [${r.type}] ${r.title}: ${r.content}`).join('\n');
  }

  close(): void {
    this.save();
  }

  private load(): void {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.records = [];
        return;
      }
      const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8')) as {
        memories?: MemoryRecord[];
      };
      this.records = Array.isArray(raw.memories) ? raw.memories : [];
    } catch {
      this.records = [];
    }
  }

  private save(): void {
    fs.writeFileSync(
      this.filePath,
      JSON.stringify({ memories: this.records }, null, 2),
      'utf8',
    );
  }
}
