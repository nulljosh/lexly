# lexly Roadmap

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
- [ ] **Bug**: completing a lesson in one course checks off lessons across ALL courses (e.g. finishing first French quiz wrongly marks Math/Logic lessons complete too) — likely a shared/global completion key instead of per-course keying
- [ ] Add bottom nav bar
- [ ] Add a Settings view; move Sign Out into Settings (currently elsewhere)
- [ ] Add light/dark mode — reuse the pattern already used in other repos (see talli/spark portfolio-tokens approach)
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
