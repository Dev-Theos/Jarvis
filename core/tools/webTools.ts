import { wrapUntrusted } from '../security/scrub.js';
import type { Tool } from './registry.js';

export function createWebTools(): Tool[] {
  return [
    {
      name: 'web_fetch',
      description: 'Fetch a URL and return text content (untrusted)',
      permission: 'safe',
      async execute(args, ctx) {
        const url = String(args.url ?? '').trim();
        if (!/^https?:\/\//i.test(url)) {
          return { ok: false, output: 'Only http(s) URLs are allowed' };
        }
        if (ctx.abortSignal.aborted) return { ok: false, output: 'Aborted' };
        const res = await fetch(url, {
          signal: ctx.abortSignal,
          headers: { 'user-agent': 'JARVIS/0.1 (personal assistant)' },
        });
        const text = await res.text();
        const stripped = text
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        return {
          ok: res.ok,
          output: wrapUntrusted(url, `HTTP ${res.status}\n${stripped.slice(0, 12000)}`),
        };
      },
    },
  ];
}
