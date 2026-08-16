# 10. Autonomous Task Execution

Example: **“Build me a coffee website.”**

1. **Understand** — intent=`create_website`, domain=`coding`, difficulty high.
2. **Requirements** — theme coffee shop; ask only if critical info missing (otherwise sensible defaults).
3. **Plan** — scaffold HTML/CSS/JS (or Vite) in workspace `projects/coffee-site`.
4. **Permission** — confirm `code_project_scaffold` / file writes.
5. **Create files** — write pages, styles, assets.
6. **Test** — static sanity checks (files exist, HTML parses); optional local preview server with confirm.
7. **Fix** — if checks fail, iterate once/twice with strong model.
8. **Show** — open preview path in UI results panel / default browser (confirm if needed).
9. **Report** — what was built, where it lives, how to open it. Never claim deploy/live hosting unless actually done.

Phase 1 implements scaffold + write + open folder/preview instructions. Full browser GUI testing is Phase 4.
