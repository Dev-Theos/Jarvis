# AGENTS.md

## Cursor Cloud specific instructions

JARVIS is a single self-contained **Electron + React + Vite (TypeScript)** desktop app. There is no backend server, database, or container to run — the only process to launch is the app itself. Long-term "memory" is a local JSON file under the OS `userData` dir, and all LLM/TTS integrations are optional external HTTP APIs. See `README.md` for the product overview and the `docs/` design docs.

Standard commands live in `package.json` scripts; use those rather than duplicating them here:

- `npm test` — Vitest suite (headless, no keys needed)
- `npm run typecheck` — TypeScript checks; this is the only static-analysis step (there is no ESLint config)
- `npm run build` — production build
- `npm run dev` — Vite dev server (port 5173) + Electron desktop window

`npm test`, `npm run typecheck`, and `npm run build` are headless-safe. Launching the GUI (`npm run dev` / `npm start`) is **not** — it needs a display and the Electron sandbox disabled:

```bash
DISPLAY=:1 ELECTRON_DISABLE_SANDBOX=1 npm run dev
```

- The cloud VM exposes a VNC display at `:1` (used by computer-use). Without `DISPLAY` set, Electron cannot open a window.
- `ELECTRON_DISABLE_SANDBOX=1` (or `--no-sandbox`) is required because the Electron chrome-sandbox is not usable in this VM.
- The `Failed to connect to the bus` (D-Bus) and `Exiting GPU process` errors printed on startup are **benign** in this headless VM — the window still renders and works.

Running without any API keys is expected: the Status panel shows `local mode` and the router falls back to local handlers. Core features still work fully offline — memory (`remember` / `recall` / `forget`), the permission gate, greetings, and the coffee-site scaffold tool. A real LLM chat reply requires a provider key (set via the in-app **Settings** panel, stored with OS `safeStorage`, or via a local `.env` from `.env.example`); keys are never required to build, typecheck, or test.
