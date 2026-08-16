# 15. Build Instructions (Phase 1)

## Prerequisites

- Node.js 22+
- npm 10+
- (Optional) OpenAI-compatible API key and/or Anthropic key
- (Optional) Fish Audio API key for TTS

## Setup

```bash
cd /path/to/Jarvis
npm install
cp .env.example .env   # optional; UI settings also work
npm run dev
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Electron + Vite dev |
| `npm run build` | Production build |
| `npm test` | Unit tests |
| `npm run typecheck` | TypeScript check |

## Configure keys

Settings panel → API keys (stored via Electron safeStorage when available).

Or environment variables (see `.env.example`).

## Test checklist

1. App window opens with JARVIS HUD
2. Send “Hello Jarvis” → personality reply
3. “Remember that my favorite coffee is oat latte” → stored
4. “What do you remember about coffee?” → recall
5. “Forget oat latte” → confirmation → deleted
6. Emergency stop cancels a long task
7. Without keys, app still runs local/tool mode and explains limits
