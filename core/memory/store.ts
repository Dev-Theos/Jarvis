import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { MemoryRecord, MemoryType } from '../types.js';

/**
 * Local persistent memory.
 * Note: Node's bundled SQLite may omit FTS5, so search uses LIKE + simple ranking.
 */
export class MemoryStore {
  private db: DatabaseSync;

  constructor(dbPath: string) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_memories_updated ON memories(updated_at DESC);
    `);
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
    this.db
      .prepare(
        `INSERT INTO memories (id, type, title, content, tags, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.id,
        record.type,
        record.title,
        record.content,
        record.tags,
        record.createdAt,
        record.updatedAt,
      );
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
    this.db
      .prepare(
        `UPDATE memories SET type=?, title=?, content=?, tags=?, updated_at=? WHERE id=?`,
      )
      .run(
        updated.type,
        updated.title,
        updated.content,
        updated.tags,
        updated.updatedAt,
        id,
      );
    return updated;
  }

  get(id: string): MemoryRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM memories WHERE id = ?`)
      .get(id) as Record<string, string> | undefined;
    return row ? this.map(row) : null;
  }

  forget(id: string): boolean {
    const result = this.db.prepare(`DELETE FROM memories WHERE id = ?`).run(id);
    return Number(result.changes) > 0;
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

    const rows = this.db
      .prepare(`SELECT * FROM memories ORDER BY updated_at DESC LIMIT 500`)
      .all() as Record<string, string>[];

    const scored = rows
      .map((row) => {
        const record = this.map(row);
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

    return scored;
  }

  list(limit = 50): MemoryRecord[] {
    const rows = this.db
      .prepare(`SELECT * FROM memories ORDER BY updated_at DESC LIMIT ?`)
      .all(limit) as Record<string, string>[];
    return rows.map((r) => this.map(r));
  }

  contextBlock(query: string, limit = 6): string {
    const rows = this.search(query, limit);
    if (!rows.length) return '';
    return rows.map((r) => `- [${r.type}] ${r.title}: ${r.content}`).join('\n');
  }

  close(): void {
    this.db.close();
  }

  private map(row: Record<string, string>): MemoryRecord {
    return {
      id: row.id,
      type: row.type as MemoryType,
      title: row.title,
      content: row.content,
      tags: row.tags,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
