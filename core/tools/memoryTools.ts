import type { MemoryStore } from '../memory/store.js';
import type { MemoryType } from '../types.js';
import type { Tool } from './registry.js';

export function createMemoryTools(store: MemoryStore): Tool[] {
  return [
    {
      name: 'memory_remember',
      description: 'Store a long-term memory',
      permission: 'safe',
      async execute(args) {
        const title = String(args.title ?? '').trim();
        const content = String(args.content ?? '').trim();
        const type = String(args.type ?? 'fact') as MemoryType;
        if (!title || !content) {
          return { ok: false, output: 'title and content are required' };
        }
        const record = store.remember({
          type,
          title,
          content,
          tags: String(args.tags ?? ''),
        });
        return {
          ok: true,
          output: `Remembered “${record.title}” (${record.id})`,
          data: record,
        };
      },
    },
    {
      name: 'memory_recall',
      description: 'Search memories',
      permission: 'safe',
      async execute(args) {
        const query = String(args.query ?? '').trim();
        const rows = store.search(query, Number(args.limit ?? 8));
        if (!rows.length) return { ok: true, output: 'No matching memories.' };
        return {
          ok: true,
          output: rows.map((r) => `• [${r.type}] ${r.title}: ${r.content}`).join('\n'),
          data: rows,
        };
      },
    },
    {
      name: 'memory_forget',
      description: 'Delete memories matching a query or id',
      permission: 'confirm',
      async execute(args, ctx) {
        const id = String(args.id ?? '').trim();
        const query = String(args.query ?? '').trim();
        if (id) {
          const ok = store.forget(id);
          return { ok, output: ok ? `Forgot memory ${id}` : 'Memory not found' };
        }
        if (!query) return { ok: false, output: 'id or query required' };
        const matches = store.search(query, 20);
        if (!matches.length) return { ok: true, output: 'Nothing to forget.' };
        const allowed = await ctx.askPermission(
          'confirm',
          `Forget ${matches.length} memor${matches.length === 1 ? 'y' : 'ies'} matching “${query}”?`,
          matches.map((m) => `${m.title}: ${m.content}`).join('\n'),
        );
        if (!allowed) return { ok: false, output: 'Permission denied.' };
        for (const m of matches) store.forget(m.id);
        return {
          ok: true,
          output: `Forgot ${matches.length} memor${matches.length === 1 ? 'y' : 'ies'}.`,
          data: matches,
        };
      },
    },
  ];
}
