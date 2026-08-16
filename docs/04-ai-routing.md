# 4. AI Routing System

## Request path

```
User (speech/text)
  → optional wake-phrase gate
  → Orchestrator.receive(turn)
  → IntentAnalyzer (cheap model or heuristics)
       outputs: intent, difficulty(0-1), risk, needed_tools[], domain
  → ModelSelector
       picks provider/model from routing table + user settings
  → Planner (if difficulty high or multi-step)
  → Execution loop (model ↔ tools via Permission Gate)
  → Verifier (external claims must match tool evidence)
  → ResponseFormatter (personality)
  → UI + optional TTS
```

## Difficulty bands

| Score | Examples | Model tier |
|------:|----------|------------|
| 0.0–0.3 | Greetings, status, simple Q&A | `cheap` |
| 0.3–0.6 | Memory ops, light research, small scripts | `standard` |
| 0.6–0.85 | Multi-file coding, deep research | `strong` |
| 0.85–1.0 | Long autonomous projects, recovery-heavy tasks | `strongest` |

## Domain overrides

- `coding` → prefer coding-capable strong model
- `classify` / `route` → always cheap
- `research` → standard/strong + web tools
- `sensitive` → strong + stricter verifier

## Escalation

If the selected model fails schema, loops, or returns low-confidence plans, the router may escalate one tier (logged) and retry once.

## Phase 1 note

If no API keys are configured, JARVIS runs in **local assistant mode**: deterministic personality replies + memory/tools that do not need an LLM, and clearly tells the user which features need keys.
