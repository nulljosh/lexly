# lexly Roadmap

## Confirmed 2026-07-21: universal app merge status
Already merged — macOS platform lives under the main "Lexly" app record (6783501611), single bundle ID `com.nulljosh.lingo` across iOS+macOS targets, one repo. The old standalone "Lexly Mac" record (6783501927) is a dead orphan that can't be deleted via API or authenticated web session (409 conflict — its only version is stuck REJECTED, which Apple's deletion endpoint refuses to touch). Genuine Apple-side restriction, needs a support ticket, not a scripting fix. No widget extension target exists in this repo, so the NSExtensionPointIdentifier bug that hit Talli/Epiphany doesn't apply here.

## 2026-07-19: rename to "Lingo" considered, dropped
- Checked App Store name availability via exact-match PATCH attempt (asc-name-creator skill) — "Lingo" is taken by a different account (`ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE.DIFFERENT_ACCOUNT`), not reclaimable without a trademark claim. Kept "Lexly" as the live name, no code/ASC changes made.

## 2026-07-19: monetization redesign (Duolingo model) + iOS resubmit + Mac merge
- [x] Removed Pro category paywall entirely — all 40+ courses free for everyone. Was the trigger for Apple's 2.1(b) "explain your paid content" question with no working checkout behind it.
- [x] Pro is now framed as an optional upgrade (unlimited streak freezes today; heart refills/extended play once Stripe is wired), never a content gate. Owner account (trommatic@icloud.com) auto-gets Pro perks.
- [x] iOS 1.1.1 resubmitted to App Review (submission after fixing age rating + attaching build 202607121732, which already had the Computer Basics fix from 634e2fc)
- [x] macOS platform added to the main "Lexly" app record (6783501611) via ASC dashboard (no API for this — had to click "Add Platform"), build 202607060001 attached to v1.1.1
- [x] Screenshot automation fixed — added accessibilityIdentifiers to disambiguate the two "Sign In" labels, plus a UITEST_SNAPSHOT bypass in AuthStore (iOS) since the demo account itself is broken (same one Apple flagged). macOS already had its own `-screenshots` launch flag.
- [x] Captured a real Mac screenshot (1280x800), uploaded it, macOS 1.1.1 submitted to App Review (submission c2eeaff0)
- [ ] "Lexly Mac" (6783501927) app deletion: tried the ASC "Remove App" dashboard control twice, canceled its review submission first (per Apple's docs), still blocked with no error detail. Needs a support ticket to Apple, not a scripting fix. Re-confirmed 2026-07-21: the merge itself is solid — macOS 1.1.1 WAITING_FOR_REVIEW under the correct iOS app record (6783501611), old standalone record's 1.1.1 is REJECTED/orphaned. Same fix pattern applied to Echo tonight; Lexly already had it from 07-19.
- [ ] **Also tried `asc web apps delete` (2026-07-21, authenticated web session)** — same wall: `409` conflict. Root cause confirmed via `asc versions list`: the app's only version is stuck in `appVersionState: REJECTED`, not `PREPARE_FOR_SUBMISSION` — Apple's web deletion endpoint (same one the dashboard uses) refuses to delete an app with a non-editable rejected version attached. This is a genuine Apple-side restriction, not a scripting gap. File the support ticket.
- [ ] Lexly Mac's own demo account (jatrommel@gmail.com) was flagged by Apple as failing sign-in (2.1 Information Needed) — moot once that app is retired, don't fix
- [ ] Native Mac UI polish: catalog/course list rows read cramped/iPhone-style rather than Mac-native density (user feedback 2026-07-19, screenshot comparison) — icon-to-text spacing and row height need a Mac-specific pass, not a port of the iOS layout

## Lexly Mac rejected 2026-07-18 (Guideline 5.2.5, "Mac" trademark) — merge into one app, DONE (see above), keeping for history
- [x] ~~Catalyst approach (c0a12b0)~~ — superseded, see below. (For posterity: Catalyst build DID succeed after adding `platformFilters = (ios, );` to the widget's PBXBuildFile embed entry, a manual pbxproj edit xcodegen doesn't support natively — not needed anymore but keep in mind if Catalyst is revisited.)
- [x] **Switched to native macOS target instead of Catalyst (1b635e1, current)** — restored `Sources/macOS` (native AppKit/SwiftUI-for-Mac, `Lingo-macOS` target in project.yml) and simply pointed its bundle ID at `com.nulljosh.lingo` (same as iOS) instead of the old `com.nulljosh.lingo.mac`. Apple allows one ASC app record to cover multiple platforms as long as every platform's target shares the same bundle ID — Catalyst isn't required for that, so this gets true native Mac UI without the iOS-compatibility-layer tradeoff.
- [x] iOS Simulator build verified green post-revert (Debug-iphonesimulator, BUILD SUCCEEDED)
- [x] Native macOS target build verified clean (4fda487) — real cause was no Xcode scheme for `Lingo-macOS` (project.yml only had one for iOS), so `-target` builds skipped SPM package resolution. Added a `Lingo-macOS` scheme to project.yml; `xcodebuild -scheme Lingo-macOS -destination 'platform=macOS' build` now BUILD SUCCEEDED clean.
- [x] Code pushed to nulljosh/lexly (1b635e1) — GitHub side already unified, single repo
- [ ] Once native Mac build verified clean: in ASC, figure out how to add native Mac platform to "Lexly" app (6783501611) — `asc apps` had no obvious subcommand, may be dashboard-only ("+Platform" on app page)
- [ ] Archive + upload new merged build (`asc xcode` helpers)
- [ ] Attach build to Lexly app version, resubmit
- [ ] Remove "Lexly Mac" (6783501927) from sale (can't delete, only deprecate/remove from sale)

## Duolingo UI patterns (Mobbin research 2026-07-16, verified against code 2026-07-16)
Checked against actual code before acting — two of three were already built, third needs data/assets we don't have. Not implementing the reskin (see notes).

- Skill-tree gating: already implemented (`renderSkillTree`/`isLessonUnlocked` in js/lingo-app.js, crown/play/lock states). Duolingo's winding dotted path w/ mascot nodes is a cutesy illustrated look — conflicts with our no-gradients/no-mascot design taste. Current minimal list-node tree stays as-is.
- Exercise header: already implemented (progressBar/progressFill/progressLabel + hearts in app/index.html + js/lingo-app.js). "NEW WORD"/"HARD EXERCISE" tag pills would need per-exercise difficulty/vocab metadata that doesn't exist in any `content/courses/*.json` (exercises are just `{type, question, answer, choices, id}`) — would have to fabricate the signal, so skipped.
- [ ] Illustrated character + speech bubble for translate exercises — real feature but needs illustration/audio assets Lexly doesn't have; asset-production task, not a code change. Revisit if/when audio assets get added.

## From chat 2026-07-14
- [ ] Lexly's landing (`index.html`) is the reference design — port it to any project under `~/Documents/Code` still missing a matching landing page. Not started this session; needs a project-by-project survey first.

## From Icons.pdf / Asc.pdf (imported 2026-07-12)
- [ ] Lexly iOS 1.1.0 REJECTED — unresolved issues in Resolution Center, fix + resubmit (Mac 1.1.0 still waiting for review)

## From Lexly.pdf (imported 2026-07-12)
- [ ] Sim-verify course loading fix on device/simulator (rainchecked — usage burning fast; xcodebuild build passed)
- [ ] Read exact 1.1.0 rejection message — `asc web review show --app 6783501611` blocked on expired Apple web session (needs 2FA relogin), then resubmit with fixed build
- [ ] Set en-US What's New for 1.1.0 (empty; flagged by `asc review doctor`) — auto-write denied by policy, run: `asc localizations update --app 6783501611 --locale en-US --whats-new "..."`
- [ ] Merge photographed pre-calc notes into PC12 masterclass — PDF embeds are ~30KB thumbnails, handwriting illegible; needs full-res originals (matches existing "pc12 re-scan pending user photos")
- [ ] Confirm final, complete A+ masterclass for both classes (PC12 + Biology) — blocked on the notes above

## Rejection 1.1.0 details (pulled 2026-07-12)
- [ ] 2.1: "Couldn't load Computer Basics" on iPad — root cause fixed in 634e2fc (missing exercise ids); verify + resubmit 1.1.1

- [ ] 1.1.1 publish blocked: "cannot create a new version in the current state" — rejected 1.1.0 version still open; edit the existing 1.1.0 appStoreVersion to 1.1.1 (or resolve/close the rejected submission) then attach build 202607121732 and resubmit. Resume: asc workflow run --file .asc/workflow.json ship-ios --resume ship-ios-20260713T003210Z-af9573cc

## From chat 2026-07-13 (wrap-up, not started)
- [x] Course list: expose Masterclass material from the list — done, catalog.json "school" category already links both masterclass HTML files, School tab in app/index.html wired. Compiled course summary still not done if wanted later.
- [x] talli/docs/school (school.heyitsmejosh.com) deleted 2026-07-17 — dead duplicate, its /api/grades + /api/quizzes never existed. Verified 2026-07-17: Vercel project already gone (404) and no DNS record exists for school.heyitsmejosh.com — nothing left to clean up.
- [ ] Richen list icons (user likes them, wants them "bumped"/more rich)
- [ ] Apple emailed 2026-07-13: issue with Lexly Mac submission (ID 02681c16-1551-43e4-8fa0-154510d89508, submitted Jul 06) — read full email / Resolution Center, likely same 2.1 course-load issue as iOS; fix + resubmit

## 2026-07-14 dump
- [ ] Mac 1.1.0 rejected — pull resolution center issues via `asc web auth login` then `asc web review show --app 6783501927`; iOS fix 634e2fc likely applies, bump 1.1.1 and resubmit both

## From Lexly.pdf (imported 2026-07-14)
- [x] **Bug fixed (342dfe0)**: cross-course completion bug was iOS/macOS-native-only (web `js/lingo-app.js` was already correctly namespaced). Root cause: `ContentStore.completedLessonIds` was a flat `Set<String>`, but course JSON files reuse generic lesson IDs (1, 2, 3…) across courses — 147 ID collisions found via script. Fixed by keying as `subjectId:lessonId` in `ContentStore.swift`/`LessonView.swift`/`UnitsView.swift`. Both iOS sim and native macOS builds verified green.
- [ ] Add bottom nav bar
- [ ] Add a Settings view; move Sign Out into Settings (currently elsewhere)
- [x] Light/dark mode — already implemented (`data-theme` toggle in app/index.html + js/lingo-app.js:721,968,975), verified 2026-07-20, no action needed
- [ ] Expand language courses beyond beginner to intermediate/expert levels
- [ ] Lessons should actually teach content, not just quiz — more Duolingo-like (currently quiz-only)
- [ ] Some lessons still don't load at all
- [ ] Lessons need a fractional/percentage progress bar; reduce whitespace, lesson view should fill the screen
- [ ] Save progress to user profile; show grade in course list once a lesson is completed

## Codecademy/Duolingo feature parity (research 2026-07-16)
Already have: 40+ courses, spaced repetition, XP, streaks, hearts, achievements, speech recognition, per-unit progress, light/dark, PWA.
- [ ] Teach-then-quiz lesson flow — short explanation/example before each exercise, not quiz-only (dup of existing item above; M effort)
- [ ] Per-lesson fractional progress bar (dup of existing item above; S effort)
- [ ] Fix cross-course completion bug (dup of existing bug above) + add real skill-tree/unit gating — lock later units until prior pass, visualize as a path (M)
- [ ] Inline correct/incorrect feedback with a brief tip on wrong answers, not just pass/fail (S–M, extend games.js scoring)
- [ ] Placement/diagnostic test per course so advanced users can skip ahead (M)
- [ ] Streak freeze / streak repair item (S)
- [ ] Richer achievement/badge screen + course-completion certificate view (S, ties to existing "richer icons" item)
- [ ] Leaderboard (friends/weekly XP) — needs backend; Supabase already wired for auth/progress sync (M–L)
- [ ] "Practice Hub" — free-practice mode across completed lessons for spaced-repetition reinforcement, separate from linear course (M)
- [ ] More listening/speaking exercise types (dictation, "speak this sentence") reusing existing speech-recognition plumbing (M)
- [ ] Weekly XP quests, reusing existing XP counters (S)
- [ ] Lower priority: hearts-refill economy tuning, timed challenge mode (S each)
- Explicitly skip: Codecademy-style full code-execution sandbox — out of scope, high effort, low relevance to a language app

## 2026-07-20: weekly-XP week-boundary timezone bug fixed
- [x] `currentWeekStart()` (js/lingo-app.js) used `.toISOString().slice(0,10)` on a local-time-adjusted Date, which converts to UTC — near midnight in any negative-UTC-offset zone (all US timezones) this could land on the wrong calendar day, silently rolling the weekly XP quest counter a day early/late. Switched to local `getFullYear/getMonth/getDate` formatting. Verified: `currentWeekStart(new Date('2026-01-01T23:30:00-05:00'))` now correctly returns `2025-12-29` (Monday) instead of jumping to the wrong week. `node tools/validate-catalog.js` still passes.

## From Lexly.pdf (imported 2026-07-19)
- [ ] Idea: integrate or copy the approach at https://calculus.academa.ai/ — described as "LLM calculus" teaching, i.e. an LLM-driven interactive math tutor. User's note: "this is exactly what Lexly should be, or at least a function of it." Exploratory — no scope pinned down yet, needs a follow-up conversation on what to actually build (full integration vs. a Lexly feature inspired by it).

## ASC review findings 2026-07-20 (via Resolution Center)
- [ ] Guideline 2.1(b) Information Needed: Apple wants a written explanation of paid-content business model. Verified: app has zero StoreKit/IAP code, nothing is currently paywalled (matches "Pro un-paywalled, courses free" state). Drafted reply ready to paste in Resolution Center: "Lexly does not currently implement In-App Purchase or any paid content. All courses and features are free to use. Any 'Pro' references in the app are vestigial from an earlier design and unlock nothing — no purchase flow exists in the current build." No CLI reply path exists (asc web review has no reply subcommand) — Joshua needs to paste this in ASC dashboard.

## Account deletion audit 2026-07-20
- [x] Added delete-account parity (Guideline 5.1.1(v)) — reused the shared `delete-account` Edge Function on spark Supabase project. Added deleteAccount() to AuthStore.swift, wired into SettingsView.swift next to existing sign-out. Web app confirmed local-profile-only, no backend account there. Build-verified.
