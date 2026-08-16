import type { MemoryStore } from '../memory/store.js';
import { createFileTools } from './fileTools.js';
import { createMemoryTools } from './memoryTools.js';
import { createProjectTool } from './projectTool.js';
import { ToolRegistry } from './registry.js';
import { createShellTool } from './shellTool.js';
import { createSystemTools } from './systemTools.js';
import { createWebTools } from './webTools.js';

export function buildDefaultToolRegistry(store: MemoryStore): ToolRegistry {
  const registry = new ToolRegistry();
  for (const tool of [
    ...createMemoryTools(store),
    ...createFileTools(),
    createShellTool(),
    ...createWebTools(),
    createProjectTool(),
    ...createSystemTools(),
  ]) {
    registry.register(tool);
  }
  return registry;
}

export { ToolRegistry } from './registry.js';
