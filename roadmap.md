# lexly Roadmap

## Email verification on signup + forgot-password flow

Lexly's signup/login UI in `js/lingo-app.js` handles basic authentication but lacks password-recovery and email-verification paths. Currently if a user forgets their password or wants account security via email verification, there's no path forward. Implement: (1) password-reset route that emails a time-limited reset token, (2) token verification before allowing a new password, (3) optional email-verification on signup (soft gate, existing accounts grandfathered, login never blocked). See sparkjar's `/api/auth/verify-email.js` + `/api/auth/password-reset.js` for a reference implementation and the mail.js helper. This requires backend API infrastructure that Lexly currently lacks — either extend the static-app model with a minimal Cloudflare Worker API, or migrate to a backend-driven architecture (more scope but enables other features like leaderboards/friends).

## Current release state (2026-08-06)
- **iOS**: 1.1.3 READY_FOR_DISTRIBUTION/shipped (build 202607271632 VALID, confirmed 2026-08-02). New icon, refreshed screenshots, What's New set.
- **macOS**: 1.1.1 REJECTED (notification 2026-08-04, submission `a91ea668-bb56-4a31-b722-d7c58782777c`, state UNRESOLVED_ISSUES, version id `f9f6e627-0b7f-421a-9e85-50cfcdf96106`). History: rejected 07-24 (bad support URL + 2.1 sign-in issue, support URL fixed 07-26), resubmitted 07-27 (submission `8c047c73`), the 08-02 "rejection" turned out to be a stuck reviewSubmission holding an orphaned deleted-IAP item (canceled + resubmitted, not a real content issue), now rejected again 08-04.
  - Ruled out: stale-deploy theory — macOS app bundles its catalog locally (`ContentStore.loadJSON` in `ios/Sources/Shared/ContentStore.swift:13`), doesn't fetch from the web, so the 2-week-stale website couldn't be the cause.
  - Leading unverified hypothesis: demo account. `jatrommel@gmail.com` was previously flagged failing sign-in (2.1) on the old standalone Lexly Mac record; the merged record likely declares the same credentials. Known-good password (per healstack recovery): `Joshisrad4$!!`. Verify login works, update review demo credentials if needed.
  - [ ] Read the Resolution Center message at appstoreconnect.apple.com (text is web-UI only), fix root cause, resubmit via `asc versions attach-build` + `asc review submissions-submit --confirm` (plain `asc review submit` unreliable on this account).
- **Lexly Mac duplicate record** (ASC 6783501927, bundle `com.nulljosh.lingo`, orphaned since the iOS+macOS merge into 6783501611): cannot be deleted via API or dashboard — its only version is stuck REJECTED, which Apple's deletion endpoint refuses to touch (confirmed via `asc web apps delete`, 409 conflict). Apple Developer Support case **102949489427** filed 2026-07-22, awaiting reply. **Do not touch further — case is open, dashboard-only from here.**

## Open — content & UI
- [x] iOS/macOS loading state replaced with a branded `SplashView` (Lexly mark + title, spring scale/fade-in) instead of a bare spinner; same mark added above the login/register title in `AuthView` for consistent branding (2026-08-08). Not Duolingo-style yet — no mascot/illustration, just a monochrome SF Symbol mark; revisit if a real illustrated splash is wanted.
- [ ] Landing page (`index.html`): user likes it, wants it "bumped more" — no specific ask, needs a follow-up conversation on direction. (Separately: this landing page is the reference design to port to any other `~/Documents/Code` project still missing a matching one — needs a project-by-project survey, not started.)
- [x] Web top nav bar reads cluttered — visual pass done 2026-08-10: streak/XP/hearts merged into one `.stat-group` pill with hairline dividers (was three competing bordered pills), trophy + theme toggle unified as identical circular `.icon-btn`s, profile chip moved to the far right so the header reads stats → actions → account. Achievement control promoted from `div[role=button]` to a real `<button>` (keyboard activation now works — it had `tabindex` but no keydown handler).
- [x] Icon simplified inside the rounded square 2026-08-10: speech bubble inset from a 20px to a ~28px margin (was nearly edge-to-edge at 200×200), corner radius 20→24, and the three dots dropped from r=11 to r=8 so they read as detail instead of three big holes. iOS 1024 + all 7 macOS PNGs regenerated from `assets/icon.svg` via rsvg-convert and alpha-flattened (App Store rejects icons with an alpha channel). Web uses the SVG directly, no raster to update.

## From Apple Notes (imported 2026-08-08)
- [ ] Course list icons (`CatalogView.swift:64`, `sfSymbol(for: subject.icon)`) need "bump/less generic" per note — currently plain SF Symbols mapped per subject; needs actual icon-set decisions (custom glyphs? different SF Symbol picks?), not a mechanical fix.
- [ ] Richen list/course icons (user wants them "bumped"/more visually rich).
- [x] Native Mac UI polish: done 2026-08-10. `SubjectRow` (`CatalogView.swift`) now carries `#if os(macOS)` metrics instead of inheriting the iOS ones — icon 32→26pt, icon-to-text gap 10pt, row padding 2→7pt, title 13pt/subtitle 11pt; the `Label` was replaced with an explicit `HStack` because `Label`'s icon spacing isn't tunable. Lesson rows in `UnitsView` get 4pt vertical padding on Mac, and both lists use `.listStyle(.inset)` there. iOS metrics unchanged. Both schemes build clean.
- [ ] A UI glitch/visual artifact reported via screenshot (2026-07-21 brain dump) — needs the actual image reviewed to diagnose, never triaged.
- [ ] "+" icon color complaint — **ruled out 2026-07-25**: no `+`/`fa-plus` exists anywhere except the Arithmetic course icon, styled identically to every other subject icon. Nothing uniquely wrong found; needs the actual screenshot to identify what the user meant before touching anything further.

## Open — content & courses
- [ ] Add more compute-related skills/courses beyond Computer Basics.
- [ ] Add more skills/games/science courses generally (content-expansion ask).
- [ ] Expand language courses beyond beginner to intermediate/expert levels.
- [ ] Lessons should actually teach content before quizzing (Duolingo-style teaching block per lesson) — content-authoring job, not UI. Includes inline correct/incorrect explanatory tips (re-classified 2026-08-04: all 785 exercises checked, zero carry a tip field — same authoring job, merge together). Scope as its own session.
- [ ] Math subjects should match Duolingo's subject/grade structure, with the ability to switch back and forth between the two systems (iOS + Mac).
- [ ] Idea: integrate/copy the approach at calculus.academa.ai — LLM-driven interactive calculus tutor. Exploratory, no scope pinned down; needs a follow-up conversation on full integration vs. a Lexly feature inspired by it.
- [ ] School section (masterclasses + a year of tutor notes/assignments) is the only part of the app with personal custom content — user considering splitting it into its own standalone project. Needs a decision, not a code change.
- [ ] Masterclasses need a clearer/more prominent tab in the UI (currently buried).
- [ ] Merge photographed pre-calc notes into PC12 masterclass — existing PDF embeds are ~30KB thumbnails, illegible; needs full-res photo originals from Joshua.
- [ ] Confirm final, complete A+ masterclass for both classes (PC12 + Biology) — blocked on the notes item above.
- [ ] **Masterclass JSON generation from Uprighty summaries** — BLOCKED: converter execution times out on the full dataset (runtime hang, not a logic error). 15 book summaries converted, catalog entries + validator support added, all deployed live. Generation itself deferred pending investigation; plan file at `~/claude/plans/tldr-shorter-and-bang-zippy-cupcake.md`.
- [ ] Duolingo Grade 4 Unit 5 (Intro to LCM) — ~40+ exercises pending sync, session budget constrained.

## Open — features (Codecademy/Duolingo parity research, 2026-07-16)
Already have: 40+ courses, spaced repetition, XP, streaks (+ freeze/repair), hearts, achievements, speech recognition, weekly XP quests, per-question progress pips, light/dark, PWA, Duolingo-style profile panel (avatar banner + stats grid, shipped 2026-08-02).
- [ ] Fractional/continuous progress bar — clarify with Joshua first: per-question pips (`n / total`) already exist and are visible; only a *smooth fill* variant (vs. discrete pips) is missing. If "fractional" meant the pip count, this is already done.
- [ ] Fix cross-course completion bug + add real skill-tree/unit gating (lock later units until prior pass, visualize as a path). (M)
- [ ] Placement/diagnostic test per course so advanced users can skip ahead. (M)
- [ ] Richer achievement/badge screen + course-completion certificate view. (S)
- [ ] Leaderboard (friends/weekly XP) — needs a friend-graph/leaderboard backend; no schema exists yet. (M–L)
- [ ] Friends/following/followers + league/social features (Duolingo reference) — same backend gap as leaderboard above, scope together. Needs its own session.
- [ ] "Practice Hub" — free-practice mode across completed lessons for spaced-repetition reinforcement, separate from the linear course. (M)
- [ ] More listening/speaking exercise types (dictation, "speak this sentence"), reusing existing speech-recognition plumbing. (M)
- [ ] Lower priority: hearts-refill economy tuning, timed challenge mode. (S each)
- [ ] Illustrated character + speech bubble for translate exercises — needs illustration/audio assets Lexly doesn't have; asset-production task. Revisit if audio assets get added.
- [ ] App Store Custom Product Page or featuring nomination ("banner like Duolingo") — Custom Product Pages (up to 35, self-serve via ASC) vs. the Apple-curated editorial banner (featuring nomination form, not purchasable) are different things; determine which Josh means, then set one up via `asc` or submit a nomination.
- Explicitly skipped: Codecademy-style full code-execution sandbox (out of scope, high effort, low relevance to a language app); Duolingo mascot/illustrated skill-tree reskin (conflicts with no-gradients/no-mascot design taste, current minimal list-tree stays).

## From Notes.app (imported 2026-08-07)
- [ ] Mac OS issues flagged (from a bare Apple Note titled "Lexly / Mac OS / Issues", no detail text, screenshot attachment lost on export) — likely related to the unresolved Mac rejection from 2026-08-04. Ask Josh for specifics next time this comes up.

## Known-broken tooling
- [ ] `tools/check-streak-freeze.js` fails: asserts `2026-07-07` but gets `2026-07-06` (off-by-one in streak rollover date). Confirmed pre-existing on a clean tree, unrelated to any recent change. Either the test fixture or `currentWeekStart()`/rollover logic is off by a day — resolve before trusting it as a gate.
- [ ] SwiftLint build-tool plugin wiring was removed from `project.yml` (`packages:`/`buildToolPlugins:`) after it broke the iOS 1.1.3 archive step (`Validate plug-in "SwiftLintBuildToolPlugin"` failure — headless archives can't grant the plugin's interactive trust prompt). If Lexly should keep SwiftLint, re-add and verify with `xcodebuild ... -skipPackagePluginValidation` before shipping.
