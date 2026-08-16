# 7. Memory Architecture

## What is stored

| Type | Examples | Default retention |
|------|----------|-------------------|
| Preference | Name style, voice on/off | Until deleted |
| Fact | “User prefers oat milk” | Until deleted |
| Project | Active coding projects | Until deleted |
| Contact | People user asked to remember | Until deleted |
| Episode | Summaries of important sessions | Rolling / user prune |
| Instruction | Standing rules | Until deleted |

JARVIS does **not** dump every token into long-term memory. The orchestrator writes memories when:

- User says “remember…”
- User confirms a suggested memory
- A completed important task summary is approved (optional setting)

## Indexing & retrieval

- JSON file under the user data directory (`memory.json`)
- Ranked keyword search over title/content/tags
- Optional later: SQLite/embeddings for larger memory corpora (Phase 3)

Retrieval: hybrid FTS → rank → inject top-k into prompt as “Memory context”.

## Edit / forget

- UI Memory panel: edit/delete
- Voice/text: “What do you remember about X?” / “Forget X.”
- `forget` requires confirmation

## Privacy

- Local DB under user data directory
- Not uploaded except as needed inside LLM prompts the user enabled
- Export/delete-all available in settings
- Secrets never stored in memory table
