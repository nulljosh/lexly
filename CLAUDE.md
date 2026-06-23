# CLAUDE.md

Guidance for working in this repo.

## What this is

Lingo — a static, vanilla JS/HTML/CSS gamified learning app. No framework, no bundler, no build step. Live at lingo.heyitsmejosh.com.

## Architecture

- `index.html` — single-page app shell, all screens are toggled divs
- `js/lingo-app.js` — app state, profile/auth (local only — no backend, profile is stored client-side), lesson loading from `content/catalog.json`
- `js/games.js` — individual lesson/game-type rendering and scoring logic
- `css/lingo.css` — all styles, includes light/dark theme via `data-theme` attribute on `<html>`

## Conventions

- No backend account system — "login" just sets a local profile (name + avatar), persisted in localStorage
- Lesson content is data-driven via JSON, not hardcoded per-lesson HTML
- Keep it framework-free; don't introduce a build step or bundler unless explicitly asked
- Accessibility: maintain `aria-label`s and skip-link already present in `index.html` when editing the header/nav

## Roadmap
- [ ] Confirm whether the app still exists/is current (recovered 2026-06-21 after accidental deletion)
- [ ] Build out: language quizzes + law quizzes, plus macOS/Windows "how to use computers" quizzes
- [x] iOS + macOS apps both exist and ship (ios/Sources/Shared is cross-platform; iOS/macOS dirs just hold each app's entry point + Info.plist)
- [x] App Store: submitted as "LingoBox" (iOS, app 6783501611) and "LingoBox Mac" (macOS, app 6783501927) — "Lingo" name was already taken on the App Store
- [x] School content (anatomy12, precalc11, precalc12) split into its own `school` category in catalog.json, not buried in math/science
- [ ] Run `/mint` on it once it stands up

## Testing
- `node tools/validate-catalog.js` — smoke-checks catalog.json structure + every course pack referenced from it
- `ios/Tests/ContentStoreTests.swift` — XCTest decoding catalog.json/course packs directly from disk (not via Bundle, to skip test-target resource wiring)
