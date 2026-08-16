# 3. Technology Selection

| Layer | Choice | Why | Cost | Alternatives | Limitations |
|-------|--------|-----|------|--------------|-------------|
| Desktop | Electron 33+ | Cross-platform, Node in main | Free/OSS | Tauri, Flutter | Heavier RAM than Tauri |
| UI | React + Vite + TypeScript | Fast DX, typed UI | Free | Svelte, solid | Bundle size |
| Core language | TypeScript | One stack for UI+core | Free | Python sidecar | Native desktop hooks less mature than Python libs |
| DB | `node:sqlite` + ranked keyword search | Built into Node 22, local | Free | better-sqlite3 + FTS5, Postgres | Experimental API; FTS5 may be unavailable in Node’s build |
| Secrets | Electron `safeStorage` | OS keychain-backed | Free | age, 1Password CLI | Needs GUI OS keychain availability |
| LLM routing | OpenAI-compatible + Anthropic | Flexible providers | Usage-based | Only Ollama | Quality depends on keys user supplies |
| TTS | Fish Audio HTTP API | User has key; good voices | Paid usage | ElevenLabs, Edge TTS, Piper | Network required for Fish |
| STT Phase 1 | Web Speech API | Free, easy | Free | Whisper.cpp, Deepgram | Browser engine quality varies |
| Wake word later | openWakeWord / Porcupine | On-device | Free / freemium | Snowboy (dead) | Needs audio pipeline work |
| Testing | Vitest | Fast unit tests | Free | Jest | — |
| Packaging | electron-builder (Phase 2) | Installers | Free | electron-forge | Not in Phase 1 MVP focus |

## Prefer replaceable adapters

Every external dependency sits behind an interface:

- `LLMProvider`
- `TTSProvider`
- `STTProvider`
- `Tool`
- `DeviceAdapter`
