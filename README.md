<img src="assets/icon.svg" width="80" style="border-radius:18px">

# Lexly

![version](https://img.shields.io/badge/version-1.1.3-blue) ![license](https://img.shields.io/badge/license-MIT-green) [![App Store](https://img.shields.io/badge/App%20Store-Download-0D96F6?logo=appstore&logoColor=white)](https://apps.apple.com/app/id6783501611) [![GitHub](https://img.shields.io/badge/GitHub-nulljosh%2Flexly-black?logo=github)](https://github.com/nulljosh/lexly)

A study app for the BC Grade 12 curriculum — Pre-Calculus 11/12, Anatomy & Physiology 12, AP Biology 12 — with a supporting library of math, science, language and skill courses. Web + native iOS/macOS.

Live at [lexly.heyitsmejosh.com](https://lexly.heyitsmejosh.com) · [App Store](https://apps.apple.com/app/id6783501611)

<p>
  <img src="screenshots/catalog.png" width="260" alt="Course catalog">
  <img src="screenshots/course.png" width="260" alt="Pre-Calculus 12 course">
</p>

## Platforms

| Platform | Name | App ID | Status |
|---|---|---|---|
| Web | Lexly | — | Live |
| iOS | Lexly (6783501611) | com.nulljosh.lingo | **Live on the [App Store](https://apps.apple.com/app/id6783501611)** — v1.1.3 |
| macOS | Lexly (6783501611, merged app record) | com.nulljosh.lingo | v1.1.1, REJECTED — see roadmap.md |

Note: the old standalone "Lexly Mac" record (6783501927) is a dead orphan superseded by the merge above — cannot be deleted, Apple support case open. Ignore it.

## Features

- BC Grade 12 core: Pre-Calculus 11/12, Anatomy & Physiology 12, AP Biology 12, plus Masterclass long-form notes
- Supporting library: math, science, 12 languages, programming, skills, book summaries
- Spaced repetition review, XP, streaks, hearts, achievements
- Speech recognition for language courses
- Native iOS/macOS: SF Symbol icon chips, spring animations, per-unit progress
- Email/password auth via Supabase (spark project), progress syncs across platforms
- Light/dark theme, PWA-ready

## Structure

```
index.html              # web app shell
css/lingo.css           # all styling
js/lingo-app.js         # state, auth/profile, lesson rendering
js/games.js             # game-type logic
content/catalog.json    # course catalog
content/courses/        # individual course packs (JSON)
ios/Sources/Shared/     # SwiftUI views (cross-platform)
ios/Sources/iOS/        # iOS entry point
ios/Sources/macOS/      # macOS entry point
school/                 # BC curriculum HTML masterclass pages
```

## Running locally

```bash
npx serve .
```

## iOS/macOS

```bash
cd ios && xcodegen generate
# archive Lexly-iOS or Lexly-macOS, upload via asc-xcode-build skill
```

## Testing

```bash
node tools/validate-catalog.js
```

## Architecture

<img src="architecture.svg" width="700">

## Roadmap

See `roadmap.md` for current open items (macOS 1.1.1 rejection fix, content/course expansion, feature backlog).

## Whitepaper

[Technical whitepaper](WHITEPAPER.md)

## API and agent tools

[`docs/API.md`](docs/API.md) documents the HTTP surface (where there is one) and
the WebMCP tools this app registers on `document.modelContext`, so an in-browser
agent can drive it. Tools are split into read-only, reversible writes, and the
few that require human confirmation.
