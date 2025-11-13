# Repository Guidelines

## Project Structure & Module Organization
- Root-level Chrome Extension (Manifest V3).
- Key files:
  - `manifest.json` — extension metadata and permissions.
  - `contentScript.js` — injects the colored top banner based on URL pattern.
  - `options.html`, `options.js` — simple options UI storing values in `chrome.storage.sync`.
- Dev-only folders to ignore in builds: `.idea/`, `.qodo/`.

## Build, Test, and Development Commands
- Run locally (unpacked):
  - Chrome/Edge: open `chrome://extensions` or `edge://extensions` → enable Developer Mode → Load unpacked → select this folder.
- Package a zip for store upload:
  - `zip -r url-tab-highlighter-v1.0.0.zip . -x "*.git*" "*.idea*" "*.qodo*"`.
- No build step or package manager is required.

## Coding Style & Naming Conventions
- Language: plain JavaScript (Manifest V3).
- Indentation: 2 spaces; end lines with semicolons.
- Naming: `camelCase` for variables/functions; keep file names consistent with existing ones (`contentScript.js`, `options.js`).
- Strings: prefer single quotes in JS; JSON requires double quotes.
- Keep the injected DOM isolated; use the `url-tab-highlighter-` prefix for IDs/classes.

## Testing Guidelines
- Manual checks:
  - Set a pattern and color in Options; navigate to a matching URL; verify a 4px banner appears at the top; verify no banner on non-matching URLs.
  - Try wildcard patterns (e.g., `https://example.com/*`).
  - Toggle values and reload pages; confirm updates apply.
- No automated test suite at present.

## Commit & Pull Request Guidelines
- Commits: present tense, concise subject, include scope if helpful.
  - Examples: `feat: add wildcard pattern matching`, `fix: guard invalid regex`, `docs: update options usage`.
- PRs should include:
  - Description, rationale, testing steps, and screenshots/GIFs of the banner behavior.
  - Note any `manifest.json` changes and permission impacts.

## Security & Configuration Tips
- Permissions: currently `storage` and `<all_urls>`. Narrow `matches` where feasible when adding features.
- Avoid heavy DOM mutation; keep `z-index` and styles minimal to prevent site interference.

## Agent-Specific Notes
- Respect Manifest V3 constraints; do not introduce background APIs without updating `manifest.json`.
- Keep changes minimal and focused; update version in `manifest.json` when publishing.
