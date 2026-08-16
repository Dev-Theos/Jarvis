# 16. Final Capability Map

| Capability | Supported? | Technology | Permission | Local/Cloud | Phase |
|------------|------------|------------|------------|-------------|------:|
| Unified chat UI | Implemented | Electron/React HUD | — | Local | 1 |
| Personality | Implemented | System prompt | — | Local | 1 |
| Text input | Implemented | HUD composer | — | Local | 1 |
| Voice input (PTT) | Implemented | Web Speech API | — | Local | 1 |
| Wake phrase config | Implemented | Settings + transcript gate | — | Local | 1 |
| Always-on wake engine | Designed | openWakeWord/Porcupine | — | Local | 3 |
| Voice output | Implemented | Fish Audio TTS adapter | — | Cloud TTS | 1 |
| Voice auth | Designed (not secure yet) | Speaker embeddings | high_risk gate | Local | 5+ |
| Model routing | Implemented | Heuristic + cheap classifier | — | Cloud/Local models | 1 |
| Multi-provider LLMs | Implemented | OpenAI-compat + Anthropic | — | Cloud/Local | 1 |
| Long-term memory | Implemented | JSON store + search | forget=confirm | Local | 1 |
| Memory UI edit/delete | Implemented | Memory panel | confirm delete | Local | 1 |
| Audit log | Implemented | SQLite + UI | — | Local | 1 |
| Emergency stop | Implemented | AbortController | — | Local | 1 |
| File read/list | Implemented | tools/files | safe/confirm | Local | 1 |
| File write | Implemented | tools/files | confirm | Local | 1 |
| Shell commands | Implemented | tools/shell | confirm/high_risk | Local | 1 |
| Build simple website | Implemented | scaffold tool | confirm | Local | 1 |
| Web fetch/research | Implemented | tools/web | safe | Cloud | 1 |
| Web search API | Not yet | Serp/Bing/etc | safe | Cloud | 2 |
| Browser automation | Designed | Playwright | confirm | Local | 4 |
| GUI click/type | Designed | nut.js / OS APIs | confirm | Local | 4 |
| Calendar/email | Designed | Provider adapters | confirm | Cloud | 5 |
| Messages | Designed | Provider adapters | confirm | Cloud | 5 |
| Phone calls | Designed | Twilio/etc | high_risk | Cloud | 5 |
| Reservations (truthful) | Partial | research + later booking tools | confirm | Mixed | 1→5 |
| Arduino/Pi devices | Designed | HTTP/MQTT/serial plugins | confirm | Local net | 6 |
| Proactive notifications | Implemented (basic) | Event bus → UI | — | Local | 1 |
| Automation engine | Designed / stub | Workflow runner | per-step | Local | 4–7 |
| Prompt-injection defenses | Implemented | Wrapping + pinned rules | — | Local | 1 |
| Secrets management | Implemented | safeStorage + scrubber | — | Local | 1 |

**Windows / macOS / Linux:** Electron supports all three — **Implemented** as target; test on your OS.
