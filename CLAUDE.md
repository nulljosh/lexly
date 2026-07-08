# CLAUDE.md

Guidance for working in this repo.

## What this is

Lexly — a static, vanilla JS/HTML/CSS gamified learning app. No framework, no bundler, no build step. Live at lexly.heyitsmejosh.com.

## Architecture

- `index.html` — marketing landing page (public root)
- `app/index.html` — single-page app shell, all screens are toggled divs
- `js/lingo-app.js` — app state, profile/auth (local only — no backend, profile is stored client-side), lesson loading from `content/catalog.json`
- `js/games.js` — individual lesson/game-type rendering and scoring logic
- `css/lingo.css` — all styles, includes light/dark theme via `data-theme` attribute on `<html>`

## Conventions

- No backend account system — "login" just sets a local profile (name + avatar), persisted in localStorage
- Lesson content is data-driven via JSON, not hardcoded per-lesson HTML
- Keep it framework-free; don't introduce a build step or bundler unless explicitly asked
- Accessibility: maintain `aria-label`s and skip-link already present in `index.html` when editing the header/nav

## Roadmap

See README.md "Roadmap" section for current open items (macOS project source, ASC version bump, submission steps blocked on Apple 2FA).

## Testing
- `node tools/validate-catalog.js` — smoke-checks catalog.json structure + every course pack referenced from it
- `ios/Tests/ContentStoreTests.swift` — XCTest decoding catalog.json/course packs directly from disk (not via Bundle, to skip test-target resource wiring)
