import { spawn } from 'node:child_process';
import { classifyShellPermission } from '../permissions/gate.js';
import type { Tool } from './registry.js';

export function createShellTool(): Tool {
  return {
    name: 'shell_run',
    description: 'Run a shell command in the workspace (always confirmed)',
    permission: 'confirm',
    async execute(args, ctx) {
      const command = String(args.command ?? '').trim();
      if (!command) return { ok: false, output: 'command required' };

      const level = classifyShellPermission(command);
      const allowed = await ctx.askPermission(
        level,
        `Run command (${level})?`,
        command,
      );
      if (!allowed) return { ok: false, output: 'Permission denied.' };

      const output = await runCommand(command, ctx.workspaceRoot, ctx.abortSignal);
      return output;
    },
  };
}

function runCommand(
  command: string,
  cwd: string,
  signal: AbortSignal,
): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    const onAbort = () => {
      child.kill('SIGTERM');
      resolve({ ok: false, output: 'Command aborted.' });
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener('abort', onAbort, { once: true });
    child.stdout.on('data', (d) => {
      stdout += String(d);
    });
    child.stderr.on('data', (d) => {
      stderr += String(d);
    });
    child.on('close', (code) => {
      signal.removeEventListener('abort', onAbort);
      const combined = `${stdout}${stderr ? `\nSTDERR:\n${stderr}` : ''}`.trim();
      resolve({
        ok: code === 0,
        output: combined.slice(0, 20000) || `Exit code ${code}`,
      });
    });
  });
}
