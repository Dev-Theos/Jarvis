# 1. JARVIS Specification

## What JARVIS is

JARVIS is a **single** personal AI assistant with:

- One desktop interface
- One identity and personality
- One persistent memory
- One central orchestrator that owns planning, tool use, permissions, and responses

It is not a set of separate chatbots or disconnected panels that each talk to different models independently.

## What the finished system should do

1. Accept text and voice input through one HUD interface.
2. Speak responses when voice output is enabled (Fish Audio or a replacement TTS provider).
3. Route work to appropriate AI models by difficulty and task type.
4. Remember, recall, edit, and forget user-approved memories.
5. Execute tools (files, research, automation, devices) only through the permission system.
6. Run multi-step tasks with progress visible in the UI.
7. Ask before sensitive/irreversible/external-communication actions.
8. Keep secrets local and never expose API keys in the UI, prompts, logs, or generated sites.
9. Provide an emergency stop that cancels active tasks and tool runs.
10. Feel like one coherent assistant on Windows, macOS, and Linux.

## Personality contract

- Professional, friendly, calm; witty when appropriate
- Concise by default; detailed on request
- May address the user as "sir" when natural
- Does not invent real-world outcomes (reservations, calls, payments)

## Non-goals (honest limits)

| Requested idea | Practical reality |
|----------------|-------------------|
| Omniscient local awareness | Only sensors/APIs the user connects |
| Perfect always-listening wake word offline | Phase 1 uses push-to-talk + phrase gate; Phase 3 adds dedicated wake-word engine |
| Unrestricted OS GUI control on day one | Phase 1: files + confirmed commands; Phase 4: accessibility/automation |
| Answering phone calls magically | Needs telephony provider + confirmation rules |
| Iron Man holographic projection | 2D/3D HUD on a normal display |

## Success criteria

A feature counts as done only when it works end-to-end for the user with real configuration (or clearly reports that a required external service is missing).
