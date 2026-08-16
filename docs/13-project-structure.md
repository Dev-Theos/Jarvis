# 13. Project Structure

```
/
  Docs.md                 # Original product requirements
  README.md               # How to run
  package.json
  electron/
    main.ts               # Electron main + IPC
    preload.ts            # Safe bridge
  core/
    orchestrator/         # Central brain
    router/               # Model routing
    memory/               # SQLite memory
    permissions/          # Gate + policy
    tools/                # Modular tools
    voice/                # TTS/STT adapters
    security/             # Secrets, scrubbing
    logging/              # Audit log
    config/               # Settings
    personality/          # System prompts
  src/                    # React HUD (renderer)
    components/
    styles/
    hooks/
  docs/                   # Architecture (this folder)
  tests/
  data/                   # Local default workspace (gitignored content)
  scripts/
```
