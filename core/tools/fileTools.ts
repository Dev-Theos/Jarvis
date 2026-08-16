import fs from 'node:fs/promises';
import path from 'node:path';
import type { Tool } from './registry.js';

function resolveSafe(root: string, rel: string): string {
  const resolved = path.resolve(root, rel || '.');
  const normalizedRoot = path.resolve(root);
  if (resolved !== normalizedRoot && !resolved.startsWith(normalizedRoot + path.sep)) {
    throw new Error('Path escapes workspace sandbox');
  }
  return resolved;
}

export function createFileTools(): Tool[] {
  return [
    {
      name: 'files_list',
      description: 'List files in the JARVIS workspace sandbox',
      permission: 'safe',
      async execute(args, ctx) {
        const rel = String(args.path ?? '.');
        const target = resolveSafe(ctx.workspaceRoot, rel);
        const entries = await fs.readdir(target, { withFileTypes: true });
        const lines = entries.map((e) => `${e.isDirectory() ? 'dir' : 'file'}\t${e.name}`);
        return { ok: true, output: lines.join('\n') || '(empty)', data: lines };
      },
    },
    {
      name: 'files_read',
      description: 'Read a UTF-8 text file from the workspace',
      permission: 'safe',
      async execute(args, ctx) {
        const rel = String(args.path ?? '');
        if (!rel) return { ok: false, output: 'path required' };
        const target = resolveSafe(ctx.workspaceRoot, rel);
        const text = await fs.readFile(target, 'utf8');
        return { ok: true, output: text.slice(0, 50000) };
      },
    },
    {
      name: 'files_write',
      description: 'Write a UTF-8 text file inside the workspace (confirm)',
      permission: 'confirm',
      async execute(args, ctx) {
        const rel = String(args.path ?? '');
        const content = String(args.content ?? '');
        if (!rel) return { ok: false, output: 'path required' };
        const target = resolveSafe(ctx.workspaceRoot, rel);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, content, 'utf8');
        return { ok: true, output: `Wrote ${rel} (${content.length} bytes)` };
      },
    },
  ];
}
