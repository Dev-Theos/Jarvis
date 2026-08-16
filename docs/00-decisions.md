# Architecture Decisions (Resolved Ambiguities)

These defaults were locked so implementation can proceed without blocking questions.

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Desktop shell | Electron + Vite + React + TypeScript | Cross-platform (Windows/macOS/Linux), one language, mature |
| Core runtime | Electron main process (Node.js) | Keeps API keys and tools off the renderer |
| Primary LLM API | OpenAI-compatible HTTP API | Works with OpenAI, Groq, OpenRouter, Ollama, Together, etc. |
| Optional LLM | Anthropic Messages API | Strong coding/reasoning when configured |
| Memory store | JSON file store (searchable) | Local, editable, works in all Electron versions without experimental sqlite |
| Secrets | Electron `safeStorage` + encrypted config file | Never in renderer, never in prompts/logs |
| TTS | Fish Audio (server-side only) | User already has a key; swappable provider interface |
| STT (Phase 1) | Web Speech API in renderer, text sent to main | Free, no key; replaceable later with Whisper |
| Wake word (Phase 1) | Configurable phrase match on transcripts + push-to-talk | Full always-on wake-word engines arrive in Phase 3 |
| Computer control (Phase 1) | Sandboxed file tools + confirmed shell commands | Full GUI automation (Phase 4) |
| Calls/SMS | Designed; Twilio/etc. Phase 5 | Needs accounts + explicit confirmations |
| Hardware | Device plugin interface; MQTT/HTTP/serial adapters | Arduino/Pi via network protocols, not pretended magic |
| UI theme | Dark cyan HUD (JARVIS-inspired) | Explicit product requirement in Docs.md |

## Status legend used in this repo

- **Designed** — architecture written
- **Implemented** — code exists and is wired
- **Tested** — automated or manual tests pass
- **Not yet implemented** — planned for a later phase
- **Requires external service** — needs user API keys/accounts
- **Impractical** — closest practical substitute documented
