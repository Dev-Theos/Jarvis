# 5. Tool Architecture

Tools are modules registered in a `ToolRegistry`.

```ts
interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
  permission: 'safe' | 'confirm' | 'high_risk';
  execute(args, ctx): Promise<ToolResult>;
}
```

Adding a capability = adding a file and registering it. No orchestrator rewrite.

## Examples

| Tool | Phase | Permission |
|------|------:|------------|
| `memory_remember` / `recall` / `forget` | 1 | safe / confirm(forget) |
| `files_list` / `files_read` / `files_write` | 1 | confirm for write outside workspace |
| `shell_run` | 1 | confirm (high_risk if destructive pattern) |
| `web_fetch` | 1 | safe (content untrusted) |
| `web_search` | 2 | safe |
| `browser_*` | 4 | confirm |
| `gui_click` / `gui_type` | 4 | confirm |
| `email_*` | 5 | confirm / high_risk |
| `calendar_*` | 5 | confirm for create/modify |
| `message_send` | 5 | confirm |
| `call_place` / `call_answer` | 5 | high_risk |
| `code_project_scaffold` | 1 | confirm |
| `device_command` | 6 | confirm |
| `arduino_send` / `pi_rpc` | 6 | confirm |

## Tool context

Each execution receives:

- `userId` / session
- `workspaceRoot` sandbox
- `abortSignal` (emergency stop)
- `audit` logger

Untrusted tool output is wrapped and labeled so models cannot treat it as system instructions.
