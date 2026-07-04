<img src="assets/icon.svg" width="80" style="border-radius:18px">

# Lexly

![version](https://img.shields.io/badge/version-1.1.0-blue) ![license](https://img.shields.io/badge/license-MIT-green) [![GitHub](https://img.shields.io/badge/GitHub-nulljosh%2Flexly-black?logo=github)](https://github.com/nulljosh/lexly)

A gamified language and skill learning app. Web + native iOS/macOS.

Live at [lexly.heyitsmejosh.com](https://lexly.heyitsmejosh.com).

## Platforms

| Platform | Name | App ID | Status |
|---|---|---|---|
| Web | Lexly | — | Live |
| iOS | Lexly (6783501611) | com.nulljosh.lingo | Build 1.1.0/6 ready to upload |
| macOS | Lexly Mac (6783501927) | com.nulljosh.lingo.mac | Build 1.1.0/6 ready to upload |

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

- [ ] No `macos/` dir in this repo — the uploaded Mac builds came from elsewhere. Add a macos/ xcodegen target (mirror `ios/`) or recover the Mac project source.
- [ ] Bump ASC version records from "1.0" to "1.1.0" to match uploaded builds, both apps.
- [ ] Submission blocked on 2 interactive steps (need Apple web session + 2FA, can't be scripted):
  1. `asc web apps availability create --app 6783501611 --territory ALL --apple-id trommatic@icloud.com` (and `--app 6783501927`)
  2. Publish App Privacy in ASC for both apps
  3. Then `asc review submit --app APP --version-id <id> --build BUILD --confirm`
