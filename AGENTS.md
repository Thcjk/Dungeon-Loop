# AGENTS.md

## Cursor Cloud specific instructions

Dungeon Loop is a **static, vanilla-JS + HTML5 Canvas browser game**. There is no build system, package manager, bundler, `package.json`, or automated test/lint suite. Everything runs client-side; game state persists in the browser `localStorage`.

### Running the game (dev)
- Serve the repo root over HTTP and open it in a browser. Standard command is in `play.sh` / `play.bat`: `python3 -m http.server 8080`, then open `http://localhost:8080`.
- It **must** be served over HTTP, not opened via `file://` — the game `fetch()`es `waves.json` and `sounds.json`, which fail on `file://` (see `OFFLINE_SPIELEN.md`).
- Python 3 is the only runtime dependency and is preinstalled; there is nothing to `install`.

### Lint / test / build
- None exist. There is no linter, test runner, or build step. CI (`.github/workflows/deploy-pages.yml`) only publishes the static files as-is to GitHub Pages.

### Notes / gotchas
- A `favicon.ico` 404 in the browser console is expected and harmless (no favicon is shipped).
- Supabase (cloud save + online leaderboard) is **optional and disabled by default** — `SUPABASE_URL`/`SUPABASE_KEY` in `script.js` are placeholders, so the game uses a local `localStorage` leaderboard. Schema lives in `supabase.sql`.
- Script tags in `index.html` use `?v=` cache-busting query params; bump them if you change a JS/CSS file and stale caching is a concern.

### Merge policy (owner preference)
- After finishing a feature/fix on a PR branch: commit, push, create/update the PR, then **merge into `main` immediately** without waiting for an extra „mergen“ request.
- Prefer: push branch → open/update PR → merge to `main` → push `main` (or `gh pr merge`) in the same turn.
