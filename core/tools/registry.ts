import type { PermissionLevel, ToolResult } from '../types.js';

export interface ToolContext {
  workspaceRoot: string;
  abortSignal: AbortSignal;
  askPermission: (
    level: PermissionLevel,
    summary: string,
    details: string,
  ) => Promise<boolean>;
}

export interface Tool {
  name: string;
  description: string;
  permission: PermissionLevel;
  execute(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult>;
}

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return [...this.tools.values()];
  }

  async run(
    name: string,
    args: Record<string, unknown>,
    ctx: ToolContext,
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) return { ok: false, output: `Unknown tool: ${name}` };
    if (ctx.abortSignal.aborted) return { ok: false, output: 'Aborted' };

    const allowed = await ctx.askPermission(
      tool.permission,
      `Allow tool “${tool.name}”?`,
      JSON.stringify(args, null, 2).slice(0, 2000),
    );
    if (!allowed) return { ok: false, output: 'Permission denied by user.' };

    return tool.execute(args, ctx);
  }
}
