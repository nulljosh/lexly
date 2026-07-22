# lexly Roadmap

## Cloudflare Pages migration — safe portion done 2026-07-21 night, DNS cutover deferred
- [ ] Port `vercel.json`'s `lingo.heyitsmejosh.com` → `lexly.heyitsmejosh.com` redirect — Pages `_redirects` file is path-based within one deployment, doesn't do cross-host redirects; needs a Cloudflare Bulk Redirect or Worker instead once `lingo.heyitsmejosh.com` is pointed at Cloudflare
- [ ] DNS cutover: swap live `lexly.heyitsmejosh.com` CNAME from Vercel to the Cloudflare Pages project, verify, then delete the Vercel project. Deliberately not attempted 2026-07-21 (live-domain change, no easy mid-swap rollback, session usage was critical) — do this in a session with more runway
- [ ] Deploy script/CI convention update: once cutover happens, update this repo's deploy docs (currently plain `git push` to Vercel per `~/Documents/Code/CLAUDE.md` stack conventions) to `wrangler pages deploy` instead

## iOS/macOS parity gaps (confirmed 2026-07-21 night, not yet built)
- [ ] **Masterclass reader — iOS has none.** `ios/Sources/Resources/content/catalog.json`'s `school` category is missing `precalc12_masterclass`/`biology_masterclass` entries that web has; no SwiftUI view renders them. Plan: bundle `school/PC12_Masterclass.html` + `Biology_Masterclass.html` into `ios/Sources/Resources/content/school/`, add matching catalog entries, and add a small `WKWebView`-backed `MasterclassReaderView.swift` under `ios/Sources/Shared/` that opens the bundled HTML (reuse `CatalogView.swift`'s tap-to-open pattern, branch on a url/local-file field like web's `subject.url` branch) — reuse existing HTML, don't build a native reader from scratch.
- [ ] **Avatar picker — iOS has none.** Web (`js/lingo-app.js`: `renderAvatarPicker()`, `AVATAR_PRESETS`, pixel-art SVG generation) has a full picker; iOS (`AuthStore.swift`/`AuthView.swift`) just hardcodes `avatarId: "falcon"` with no UI. This is also the open "click avatar to refresh, instant, persists to profile" request below — port web's `AVATAR_PRESETS` + SVG logic into a SwiftUI picker view, wire to `AuthStore` the same way `epiphany`'s avatar-refresh pattern works.

## Open from user brain dump 2026-07-21 (screenshots + notes, not yet triaged into code)
- [ ] Landing page: user likes it a lot, wants it "bumped more" — no specific ask, needs a follow-up conversation on direction
- [ ] "Computers" tab should merge into "Programming" with a better combined title; add more compute-related skills/courses
- [ ] School section (masterclasses + a year of tutor notes/assignments) is the only part of the app with personal custom content — user considering splitting it into its own standalone project. Needs a decision, not just a code change.
- [ ] Masterclasses need a clearer/more prominent tab in the UI (currently buried) — separate from the redirect bug already fixed above
- [ ] Masterclass pages should render as a book/reader view of the actual notes content, not just open the raw HTML file as-is — check `school/PC12_Masterclass.html` / `school/Biology_Masterclass.html` rendering vs. desired reader UX
- [ ] Web top nav bar reads cluttered (screenshot) — needs a visual pass
- [ ] "+" icon should be white in light mode, currently isn't (screenshot) — check icon color token/SVG fill
- [ ] Footer text spacing needs improvement (screenshot)
- [ ] Add more skills/games/science courses (multiple screenshots, general content-expansion ask)
- [ ] A UI glitch/visual artifact reported via screenshot — needs the actual image reviewed to diagnose (not visible in this text-only pass)
- [ ] Top subject nav (languages/programming/etc.) currently scrolls vertically — should be horizontal-scroll only. Find the nav container CSS (didn't match common class names `.nav-scroll`/`.subject-nav`/`.tabs-scroll` — needs a fresh grep of `app/index.html`/`css/lingo.css` for the actual subject-picker markup)
- [ ] Portfolio/profile: want the same "click avatar to refresh" instant feature other apps (epiphany etc.) have — should update instantly and persist to user profile; also general profile spacing/UI cleanup
- [ ] School dashboard link is broken — clicking it bounces back to the landing page instead of the dashboard (separate from the masterclass fix above, needs its own repro)

Full brain dump also exported to a PDF in ~/Downloads for image reference — screenshots referenced above are only described from user's captions, not directly reviewed this session.

## Confirmed 2026-07-21: universal app merge status
Already merged — macOS platform lives under the main "Lexly" app record (6783501611), single bundle ID `com.nulljosh.lingo` across iOS+macOS targets, one repo. The old standalone "Lexly Mac" record (6783501927) is a dead orphan that can't be deleted via API or authenticated web session (409 conflict — its only version is stuck REJECTED, which Apple's deletion endpoint refuses to touch). Genuine Apple-side restriction, needs a support ticket, not a scripting fix. No widget extension target exists in this repo, so the NSExtensionPointIdentifier bug that hit Talli/Epiphany doesn't apply here.

## 2026-07-19: rename to "Lingo" considered, dropped
- Checked App Store name availability via exact-match PATCH attempt (asc-name-creator skill) — "Lingo" is taken by a different account (`ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE.DIFFERENT_ACCOUNT`), not reclaimable without a trademark claim. Kept "Lexly" as the live name, no code/ASC changes made.

## 2026-07-19: monetization redesign (Duolingo model) + iOS resubmit + Mac merge
- [ ] "Lexly Mac" (6783501927) app deletion: tried the ASC "Remove App" dashboard control twice, canceled its review submission first (per Apple's docs), still blocked with no error detail. Needs a support ticket to Apple, not a scripting fix. Re-confirmed 2026-07-21: the merge itself is solid — macOS 1.1.1 WAITING_FOR_REVIEW under the correct iOS app record (6783501611), old standalone record's 1.1.1 is REJECTED/orphaned. Same fix pattern applied to Echo tonight; Lexly already had it from 07-19.
- [ ] **Also tried `asc web apps delete` (2026-07-21, authenticated web session)** — same wall: `409` conflict. Root cause confirmed via `asc versions list`: the app's only version is stuck in `appVersionState: REJECTED`, not `PREPARE_FOR_SUBMISSION` — Apple's web deletion endpoint (same one the dashboard uses) refuses to delete an app with a non-editable rejected version attached. This is a genuine Apple-side restriction, not a scripting gap. File the support ticket.
- [ ] Lexly Mac's own demo account (jatrommel@gmail.com) was flagged by Apple as failing sign-in (2.1 Information Needed) — moot once that app is retired, don't fix
- [ ] Native Mac UI polish: catalog/course list rows read cramped/iPhone-style rather than Mac-native density (user feedback 2026-07-19, screenshot comparison) — icon-to-text spacing and row height need a Mac-specific pass, not a port of the iOS layout

## Lexly Mac rejected 2026-07-18 (Guideline 5.2.5, "Mac" trademark) — merge into one app, DONE (see above), keeping for history
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
- [ ] Richen list icons (user likes them, wants them "bumped"/more rich)
- [ ] Apple emailed 2026-07-13: issue with Lexly Mac submission (ID 02681c16-1551-43e4-8fa0-154510d89508, submitted Jul 06) — read full email / Resolution Center, likely same 2.1 course-load issue as iOS; fix + resubmit

## 2026-07-14 dump
- [ ] Mac 1.1.0 rejected — pull resolution center issues via `asc web auth login` then `asc web review show --app 6783501927`; iOS fix 634e2fc likely applies, bump 1.1.1 and resubmit both

## From Lexly.pdf (imported 2026-07-14)
- [ ] Add bottom nav bar
- [ ] Add a Settings view; move Sign Out into Settings (currently elsewhere)
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

## From Lexly.pdf (imported 2026-07-19)
- [ ] Idea: integrate or copy the approach at https://calculus.academa.ai/ — described as "LLM calculus" teaching, i.e. an LLM-driven interactive math tutor. User's note: "this is exactly what Lexly should be, or at least a function of it." Exploratory — no scope pinned down yet, needs a follow-up conversation on what to actually build (full integration vs. a Lexly feature inspired by it).

## ASC review findings 2026-07-20 (via Resolution Center)
- [ ] Guideline 2.1(b) Information Needed: Apple wants a written explanation of paid-content business model. Verified: app has zero StoreKit/IAP code, nothing is currently paywalled (matches "Pro un-paywalled, courses free" state). Drafted reply ready to paste in Resolution Center: "Lexly does not currently implement In-App Purchase or any paid content. All courses and features are free to use. Any 'Pro' references in the app are vestigial from an earlier design and unlock nothing — no purchase flow exists in the current build." No CLI reply path exists (asc web review has no reply subcommand) — Joshua needs to paste this in ASC dashboard.
