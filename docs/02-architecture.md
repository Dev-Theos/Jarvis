# 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Desktop HUD (Renderer)                  │
│  Conversation │ Voice │ Tasks │ Memory │ Permissions │ Logs │
└───────────────────────────┬─────────────────────────────────┘
                            │ IPC (preload bridge)
┌───────────────────────────▼─────────────────────────────────┐
│                 Electron Main / Orchestrator                │
│  Personality │ Session │ Planner │ Verifier │ Emergency Stop│
└───────┬───────────┬───────────┬───────────┬─────────────────┘
        │           │           │           │
   ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
   │ Model   │ │ Memory  │ │ Tool    │ │ Voice   │
   │ Router  │ │ Store   │ │ Runtime │ │ Pipeline│
   └────┬────┘ └─────────┘ └────┬────┘ └────┬────┘
        │                       │           │
   Providers               Permission    TTS/STT
   (cheap→strong)          Gate + Audit  adapters
        │                       │
        └───────────┬───────────┘
                    ▼
         Device / Automation plugins
```

## Component responsibilities

| Component | Role |
|-----------|------|
| **Orchestrator** | Single entry for every user turn; owns conversation state, planning, tool loops, final reply |
| **Model router** | Classifies intent/difficulty; picks provider+model; can escalate mid-task |
| **Agent/planner** | Breaks complex goals into steps; tracks progress and recovery |
| **Tool system** | Modular tools with schemas, permission tiers, timeouts |
| **Memory** | SQLite facts/preferences/episodes; FTS search; user edit/delete |
| **Voice pipeline** | Wake/PTT → STT → orchestrator → TTS; interruptible playback |
| **Computer-control layer** | Files, shell, later GUI automation — always gated |
| **Browser/web layer** | Fetch/search tools; untrusted content never overrides security |
| **Communication layer** | Calls/messages/email adapters (later phases) |
| **Automation engine** | Saved multi-step workflows with permissions baked in |
| **Hardware layer** | Device plugins (HTTP/MQTT/serial) for Pi/Arduino/etc. |
| **Security/permissions** | Action classes, confirmations, safeStorage secrets |
| **Logging** | Auditable action log + UI history |
| **UI** | One interface for all of the above |

## How components communicate

1. Renderer sends `jarvis:message` / voice events over a typed preload IPC API.
2. Main-process orchestrator loads memory context + settings.
3. Router classifies the turn and selects a model.
4. Model may request tools; Tool Runtime checks permissions, executes, returns results.
5. Orchestrator verifies claims about external actions against tool results.
6. Reply streams (or returns) to UI; optional TTS speaks it.
7. Every gated action appends to the audit log.

Untrusted content (webpages, files, emails, tool output) is treated as **data**, never as authority to change permissions or core rules.
