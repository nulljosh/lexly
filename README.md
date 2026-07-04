<img src="assets/icon.svg" width="80" style="border-radius:18px">

# Lexly

![version](https://img.shields.io/badge/version-1.1.0-blue) ![license](https://img.shields.io/badge/license-MIT-green) [![GitHub](https://img.shields.io/badge/GitHub-nulljosh%2Flexly-black?logo=github)](https://github.com/nulljosh/lexly)

A gamified language and skill learning app. Web + native iOS/macOS.

Live at [lexly.heyitsmejosh.com](https://lexly.heyitsmejosh.com).

## Platforms

| Platform | Name | App ID | Status |
|---|---|---|---|
| Web | Lexly | — | Live |
| iOS | Lexly (6783501611) | com.nulljosh.lingo | v1.1.0, build 202607030001 attached, awaiting submission |
| macOS | Lexly Mac (6783501927) | com.nulljosh.lingo.mac | v1.1.0, build 202607030001 attached, awaiting submission |

## Features

- 40+ courses: languages, programming, math, science, school (PC12, AP Bio 12), skills
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

## Roadmap

- [x] `Lingo-macOS` target already exists in `ios/project.yml` and builds clean locally (`xcodebuild -scheme Lingo-macOS`) — no separate `macos/` dir needed.
- [x] ASC version records bumped 1.0 → 1.1.0, latest build (202607030001) attached to both apps.
- [ ] Submission blocked on 2 interactive steps (need Apple web session + 2FA, can't be scripted):
  1. `asc web apps availability create --app 6783501611 --territory ALL --apple-id trommatic@icloud.com` (and `--app 6783501927`)
  2. Publish App Privacy in ASC for both apps
  3. Then `asc review submit --app APP --version-id <id> --build BUILD --confirm`
