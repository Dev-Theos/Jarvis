import type { Tool } from './registry.js';

export function createSystemTools(): Tool[] {
  return [
    {
      name: 'system_status',
      description: 'Report basic JARVIS runtime status',
      permission: 'safe',
      async execute(_args, ctx) {
        return {
          ok: true,
          output: [
            `workspace: ${ctx.workspaceRoot}`,
            `platform: ${process.platform}`,
            `node: ${process.version}`,
            `aborted: ${ctx.abortSignal.aborted}`,
          ].join('\n'),
        };
      },
    },
  ];
}
