# 6. Permission System

## Classes

### Safe automatic
- Read memory, list workspace files, system status
- Web fetch for research (content treated as untrusted)
- Speak already-approved replies
- Local analysis / planning

### Confirmation required
- Write/edit files
- Run shell commands
- Send messages / emails
- Create calendar events
- Device commands
- Start long automations that touch the network

### High-risk (stronger auth)
- Delete files / irreversible destroy
- Place or answer calls
- Financial actions
- Talk to other people when no standing rule exists
- Change security settings / export all memory

## UX for confirmation

1. Orchestrator pauses and emits `permission_request` to UI + optional voice prompt:  
   “I need permission to run `shell_run`: `npm create vite@latest …`. Approve?”
2. UI shows Approve / Deny / Always allow this tool for this session.
3. Timeout denies by default.
4. Decision is audited.

Safe actions stay fast — no prompts.

## Emergency stop

UI and voice (“stop Jarvis”) set a global abort flag that cancels in-flight tool calls and stops TTS.
