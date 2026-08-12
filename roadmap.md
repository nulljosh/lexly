# lexly Roadmap

## App Review rejection reason — READ FROM RESOLUTION CENTER 2026-08-12

Two Mac records, two different rejections. Both are macOS 1.1.1; iOS 1.1.3 is live and fine.

**Record `6783501611` (the real one) — Guideline 2.1(a) App Completeness.** Reviewed
2026-08-04, MacBook Pro 14-inch, macOS 26.6, build 202607261932.

> Bug description: upon review we have found when we entered login details that the
> **Sign In will load briefly and then stops**.

**Record `6783501927` (the duplicate) — two reasons.** Reviewed 2026-08-07, build 202607171509.

1. **Guideline 5.2.5 — Legal — Intellectual Property.** *"Terms for Mac in the app name in an
   inappropriate manner."* The app record is literally named **"Lexly Mac"** — Apple treats
   "Mac" in the name as trademark misuse. **This record can never ship under that name.**
   Rename it, or delete the duplicate record (the standing plan) and ship macOS under the
   iOS record as a platform.
2. **Guideline 2.1 — Information Needed.** The demo account in App Store Connect does not
   work: `jatrommel@gmail.com` / `Joshisrad4$!!` — *"We also received an error message when
   tried to sign up with own account."* Note those credentials match
   `project_dose_account_recovery` and are now known-bad to reviewers.

Sign-in failure is shared with healstack and sparkjar — one root cause, three apps.

Source: `asc web review show --app 6783501611 --apple-id trommatic@icloud.com` (needs `asc-login`;
the public API only returns a generic "unresolved issues" wrapper). Submissions frozen
until 2026-08-18 regardless — fix and stage, do not submit.

## ASC state VERIFIED 2026-08-12 (`asc versions list`)

**iOS 1.1.3 is LIVE** (`READY_FOR_SALE`). **macOS 1.1.1 is `REJECTED` on both records** —
the real one `6783501611` and the duplicate `6783501927`. Reason is Resolution-Center-only
(needs `asc-login`).

Submissions frozen until 2026-08-18 (Guideline 5.6 review) — build and stage only, no
`asc review submit`. Anything below this heading predates this check; trust this block.

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
- [ ] Landing page (`index.html`): user likes it, wants it "bumped more" — no specific ask, needs a follow-up conversation on direction. (Separately: this landing page is the reference design to port to any other `~/Documents/Code` project still missing a matching one — needs a project-by-project survey, not started.)

## From Apple Notes (imported 2026-08-08)
- [ ] Course list icons (`CatalogView.swift:64`, `sfSymbol(for: subject.icon)`) need "bump/less generic" per note — currently plain SF Symbols mapped per subject; needs actual icon-set decisions (custom glyphs? different SF Symbol picks?), not a mechanical fix.
- [ ] Richen list/course icons (user wants them "bumped"/more visually rich).
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
- [x] `tools/check-streak-freeze.js` off-by-one — **the test fixture was wrong, not `currentWeekStart()`**. 2026-07-07 is a Tuesday (the test's comments mislabelled it, and 07-09/07-14, as Mon/Wed/Mon); on top of that `new Date('YYYY-MM-DD')` parses as UTC midnight while `currentWeekStart()` reads `getDay()`/`getDate()` locally, shifting the input back a day in negative-offset zones. Fixed by passing local-midnight `new Date(2026, 6, 6)` and expecting `2026-07-06`; now passes under UTC/Vancouver/Berlin/Auckland (it failed in all of them before). Production logic verified correct — Mon–Sun all map to the same Monday, rollover lands on Monday, month/year boundaries hold. No user streaks were affected.
- [ ] SwiftLint build-tool plugin wiring was removed from `project.yml` (`packages:`/`buildToolPlugins:`) after it broke the iOS 1.1.3 archive step (`Validate plug-in "SwiftLintBuildToolPlugin"` failure — headless archives can't grant the plugin's interactive trust prompt). If Lexly should keep SwiftLint, re-add and verify with `xcodebuild ... -skipPackagePluginValidation` before shipping.

## App Store submission freeze — until 2026-08-18
- [ ] **BLOCKED: no App Store submission on any app until 2026-08-18.** Account is under a Guideline 5.6 Developer Code of Conduct review suspension (Curvely, Transcriptly, Wiretext, NYC Survive). Apple warns that continued similar submissions may result in removal from the Apple Developer Program. Full detail: wiki `ship-plan.md` § "Guideline 5.6 suspension (2026-08-10)". TestFlight builds, pushes and web deploys are still fine.
- [ ] Lexly Mac (6783501927) REJECTED on two counts. **5.2.5 IP:** the record name "Lexly Mac" uses the term "Mac" inappropriately — rename the App Store record to drop "Mac". **2.1:** the demo account jatrommel@gmail.com / Joshisrad4$!! does not work for reviewers and sign-up also errors — fix production auth and re-verify the demo credentials by actually signing in with them.

## Decision 2026-08-10: merge Lexly Mac into one Universal Purchase record
Apple rejected "Lexly Mac" under 5.2.5 — the name uses "Mac" inappropriately. Rather than
rename around it, collapse the two records. Voxprint (6782604262) already proved one app record
serves iOS + macOS via Universal Purchase, so the second record is what created the naming
problem in the first place.
- [ ] Add macOS as a platform on the existing **Lexly** record (6783501611) as a Universal Purchase, rather than keeping a separate Mac app.
- [ ] Point the macOS build at that record; verify the Mac bundle ID is registered against the same app.
- [ ] Once macOS ships under the Lexly record, delete the orphaned **Lexly Mac** record (6783501927). That retires the 5.2.5 rejection permanently instead of renaming around it.
- [ ] Blocked until 2026-08-18 by the submission freeze. Do the record work first, submit after.

## 2026-08-10 — the Universal Purchase merge is ALREADY DONE; only the duplicate deletion is left
Verified via the API tonight. The main **Lexly** record (6783501611, `com.nulljosh.lingo`)
already carries **MAC_OS 1.1.1** alongside iOS 1.1.3/1.1.2/1.1.1. So Lexly is already one record
serving both platforms — no merge work is needed.

The separate **Lexly Mac** record (6783501927, `com.nulljosh.lingo.mac`) is a pure duplicate. Its
only version is MAC_OS 1.1.1 REJECTED — nothing live, nothing to lose. It is also the record that
drew the 5.2.5 "Mac in the app name" rejection. Deleting it retires that rejection permanently
and removes a rejected record from the review queue.

Also verified: the App Review demo account `jatrommel@gmail.com` now signs in cleanly against the
shared Supabase project (HTTP 200), so the 2.1 "we couldn't sign in" half of that rejection looks
already resolved. The related Healstack demo account was genuinely broken and was fixed tonight —
see healstack/roadmap.md; same shared database, different user row.

- [ ] Delete the duplicate: `asc web apps delete --app 6783501927 --expected-bundle-id com.nulljosh.lingo.mac --confirm`. **Deliberately not run tonight** — it is irreversible and Joshua was away from the keyboard, and there is zero time value in doing it before the 2026-08-18 freeze lifts. The `asc web` session was confirmed valid at the time of writing, so this is unblocked whenever he wants it run.

## App Store screenshots (queued 2026-08-11)
`screenshots/` is hand-made PNGs (6.5/6.7/mac), last touched 2026-07-27, no harness.
Build one with the `appstore-screenshots` skill, then run. Copy the pattern from
`talli/ios`: Snapfile needs `xcargs("-skipPackagePluginValidation -skipMacroValidation")`,
and the mock must cover every network refresh path, not just `init` — see talli 7386f1d.

## From Apple Notes (imported 2026-08-11)
- [ ] iOS: login works but no success message / no visual feedback on button tap
- [ ] iOS: Settings is bare — login provides no actual information or data afterward
- [ ] iOS: add padding to app icon (or scale the glyph down)
- [ ] Web landing page: screenshots are basic and mildly stale — refresh them

> Resume note (2026-08-11): a `wip: partial work from /work notes ingest` commit holds unfinished, unverified changes for the items above. Review `git show HEAD` before building on it — it was committed mid-flight, not reviewed, and is unpushed.
