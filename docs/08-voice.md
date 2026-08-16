# 8. Voice Architecture

```
Mic → [Wake/PTT gate] → STTProvider → text
                                    ↓
                              Orchestrator
                                    ↓
                              reply text
                                    ↓
                              TTSProvider → speakers
```

## Providers (swappable)

- `FishAudioTTS` — HTTPS to Fish Audio; API key only in main process
- `WebSpeechSTT` — renderer captures transcript, sends text over IPC
- Future: `WhisperSTT`, `PiperTTS`, etc.

## Wake phrase

- Default: `jarvis`
- User-configurable list in settings
- Phase 1: match against STT transcript prefix/contains
- Phase 3: dedicated on-device wake-word engine

## Interruption

- New PTT / “stop” aborts TTS playback and current tool loop (if safe to cancel)

## Voice authentication

- Phase 1: not claimed as secure auth (impractical to ship robust speaker-ID without enrollment UX)
- Phase 5+: optional speaker embedding gate for high-risk actions — closest practical path

## Security

Fish Audio key lives in encrypted settings; renderer only receives audio buffers or local file URLs, never the key.
