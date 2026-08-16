# 14. Development Roadmap

## Phase 1 — Smallest working JARVIS (THIS IMPLEMENTATION)
- **Goal:** One desktop assistant: chat, memory, routing, permissions, basic tools, TTS hook, HUD
- **Features:** Text chat, memory CRUD, model router, file/shell/web_fetch tools, Fish Audio TTS, PTT STT bridge, audit log, emergency stop
- **Tech:** Electron, React, TypeScript, JSON memory store, Vitest
- **Done when:** App launches; user can chat; remember/forget works; confirmations work; tests pass; missing keys are clearly reported

## Phase 2 — Packaging & research
- electron-builder installers, web_search provider, richer task UI, settings encryption polish

## Phase 3 — Voice depth
- On-device wake word, Whisper STT option, semantic memory embeddings

## Phase 4 — Computer use
- Browser automation, GUI click/type via OS accessibility, workflow recorder

## Phase 5 — Communications & personal assistant
- Email/calendar/messages; Twilio (or similar) calls with confirmations

## Phase 6 — Hardware
- Device plugins for Arduino/Raspberry Pi (HTTP/MQTT/serial)

## Phase 7 — Autonomy hardening
- Long-running agent supervisor, stronger verifier, automation marketplace of user workflows
