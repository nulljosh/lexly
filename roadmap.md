# Lexly Roadmap

## Session handoff (2026-07-01)
- [x] **Naming resolved 2026-07-01**: final name is **Lexly** (matches ASC 6783501611/6783501927). Repo, web UI, plists, docs aligned; bundle IDs stay com.nulljosh.lingo(.mac).
- [ ] **No macos/ dir in this repo** — Mac builds can't be produced locally; the uploaded Mac builds came from elsewhere. Add a macos/ xcodegen target (mirror ios/) or recover the Mac project source.
- [x] Screenshots + metadata done 2026-07-02 via asc: description/keywords/support URL/subtitle/privacy URL updated (Lexly branding), iOS 6.5"+6.7" + Mac 1280x800 screenshots uploaded, age rating all-none, review details set, privacy.html live.
- [ ] SUBMIT BLOCKED on 2 interactive steps: (1) availability bootstrap needs Apple web session 2FA — run `asc web apps availability create --app 6783501611 --territory ALL --apple-id trommatic@icloud.com` (and 6783501927); (2) publish App Privacy in ASC for both apps. Then `asc review submit --app APP --version-id d7c8a627-5487-4bd9-a934-09cd7094c931 / 4f5decc7-5b1a-47b5-a07f-51277d9bc3fd --build BUILD --confirm`. Note: ASC version records are "1.0" but builds are 1.1.0 — bump version string first.

## From icons-bugs.pdf (imported 2026-06-30)
- [x] Fix icon scaling — fixed 2026-07-02: regenerated 1024×1024 no-alpha icons for iOS+macOS (recovered from stale lingo/ clone before deleting it)

## From Lingo.pdf (imported 2026-07-01)
- [x] Sign-in broken since Supabase migration — fixed 2026-07-02 (4002822: hydrateFromDb wrapped in try/catch, profile auto-created on first sign-in). Verified live at lexly.heyitsmejosh.com.
- [x] Login popup background is transparent — fixed (f951b45, uses --bg-secondary)
- [x] Remove "choose avatar" step from signup flow — done 2026-07-02 (default avatar assigned, changeable in profile)
