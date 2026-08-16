# JARVIS

Unified personal AI assistant — **Phase 1** implementation based on `Docs.md`.

One interface. One identity. One memory. One orchestrator.

## What works now (Implemented + Tested)

- Desktop HUD (Electron + React)
- Text chat with JARVIS personality
- Push-to-talk voice input (Web Speech API where available)
- Configurable wake phrases
- Fish Audio TTS adapter (optional key; main-process only)
- Local JSON memory: remember / recall / forget (+ UI)
  - Ranked keyword search (portable; no Electron sqlite dependency)
- Model router (cheap → strongest; OpenAI-compatible + Anthropic)
- Permission gate with Approve / Deny / Allow-for-session
- Tools: memory, sandboxed files, confirmed shell, web fetch, coffee-site scaffold
- Audit log + emergency stop
- Honest reservation flow (does **not** invent bookings)

## Designed for later phases

Full GUI computer control, always-on wake-word engine, phone calls/SMS, email/calendar providers, Arduino/Pi device plugins — see `docs/14-roadmap.md` and `docs/16-capability-map.md`.

## Quick start

```bash
npm install
cp .env.example .env   # optional
npm run dev            # Electron + Vite
```

Open **Settings** in the app to paste API keys (stored via OS `safeStorage` when available).

### Useful scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Run the desktop app |
| `npm test` | Unit/integration tests |
| `npm run typecheck` | TypeScript checks |
| `npm run build` | Production build |

## Architecture docs

Start at `docs/00-decisions.md`, then `docs/01-specification.md` … `docs/16-capability-map.md`.

Original requirements remain in `Docs.md`.

## Security notes

- API keys never go to the renderer.
- Untrusted web/file content is wrapped and cannot override permissions.
- Destructive actions require confirmation.
- Emergency Stop aborts active work and TTS.

## License

Private project — see repository owner settings.
