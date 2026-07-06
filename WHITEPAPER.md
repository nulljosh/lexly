# Lexly Technical Whitepaper

**v1.1.0** | July 2026

Lexly is a gamified learning app — not just languages, everything. 40+ courses
span languages, programming, math, science, school curricula (Pre-Calculus 12,
AP Biology 12), and general skills, all driven by one content schema. Live at
[lexly.heyitsmejosh.com](https://lexly.heyitsmejosh.com), with native iOS and
macOS apps sharing progress across platforms.

## Core Mechanic: One Schema, Any Subject

Everything the app teaches is data, not code. `content/catalog.json` declares
subjects, courses, units, and lessons; a lesson is a sequence of typed
exercises (multiple choice, translation, listening, typing). Adding a new
course — whether Spanish or Pre-Calc 12 — is a JSON change, no app update.
Masterclass courses are surfaced as normal course cards via url-type subjects
in the same catalog.

The engagement loop is standard spaced-repetition gamification:

- **Spaced repetition review** — missed items resurface on a decay schedule.
- **XP and streaks** — daily goal, streak counter, and an iOS home screen
  widget showing both.
- **Hearts** — wrong answers cost hearts, gating brute-force guessing.
- **Achievements** — milestone badges across courses.
- **Speech recognition** — language courses score spoken answers via the
  platform speech APIs.

## Architecture

- **Web**: vanilla JS/HTML/CSS. No framework, no bundler, no build step. The
  whole app is a single-page app of toggled divs — first paint is one HTML
  file.
- **Content**: `content/catalog.json` plus per-course `course-data.json`
  bundles. The iOS `ContentStore` walks the bundle directory tree to find
  course data regardless of how xcodegen nests resources.
- **Auth + sync**: Supabase email/password (shared spark project). Progress
  writes sync across web, iOS, and macOS; profiles auto-create on first
  sign-in.
- **Native apps**: xcodegen projects, SF Symbol icon chips, spring animations,
  per-unit progress. Ships via `asc workflow run ship-ios`.

## Platforms

| Platform | App ID | Status |
|---|---|---|
| Web | — | Live |
| iOS (6783501611) | com.nulljosh.lingo | v1.1.0 Waiting for Review |
| macOS (6783501927) | com.nulljosh.lingo.mac | v1.1.0 Waiting for Review |

## Privacy

No ads, no trackers. The only stored data is the account email and per-lesson
progress in Supabase (RLS enabled). Speech recognition runs through the OS
APIs; audio is not retained.
