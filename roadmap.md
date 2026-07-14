# lexly Roadmap

## From Icons.pdf / Asc.pdf (imported 2026-07-12)
- [ ] Lexly iOS 1.1.0 REJECTED — unresolved issues in Resolution Center, fix + resubmit (Mac 1.1.0 still waiting for review)

## From Lexly.pdf (imported 2026-07-12)
- [x] Fix courses not loading on iOS (Spanish, Computer Basics, Python) — exercises missing `id`, Swift decode failed; ids backfilled in both content copies, validator now checks exercise fields. Build succeeded.
- [ ] Sim-verify course loading fix on device/simulator (rainchecked — usage burning fast; xcodebuild build passed)
- [ ] Read exact 1.1.0 rejection message — `asc web review show --app 6783501611` blocked on expired Apple web session (needs 2FA relogin), then resubmit with fixed build
- [ ] Set en-US What's New for 1.1.0 (empty; flagged by `asc review doctor`) — auto-write denied by policy, run: `asc localizations update --app 6783501611 --locale en-US --whats-new "..."`
- [ ] Merge photographed pre-calc notes into PC12 masterclass — PDF embeds are ~30KB thumbnails, handwriting illegible; needs full-res originals (matches existing "pc12 re-scan pending user photos")
- [ ] Confirm final, complete A+ masterclass for both classes (PC12 + Biology) — blocked on the notes above

## Rejection 1.1.0 details (pulled 2026-07-12)
- [ ] 2.1: "Couldn't load Computer Basics" on iPad — root cause fixed in 634e2fc (missing exercise ids); verify + resubmit 1.1.1

- [ ] 1.1.1 publish blocked: "cannot create a new version in the current state" — rejected 1.1.0 version still open; edit the existing 1.1.0 appStoreVersion to 1.1.1 (or resolve/close the rejected submission) then attach build 202607121732 and resubmit. Resume: asc workflow run --file .asc/workflow.json ship-ios --resume ship-ios-20260713T003210Z-af9573cc

## From chat 2026-07-13 (wrap-up, not started)
- [ ] Course list: expose Masterclass PDFs/material itself from the list (not only tests/quizzes per unit) + compiled course summary — see school/Biology_Masterclass.html, school/PC12_Masterclass.html, content/catalog.json
- [ ] Richen list icons (user likes them, wants them "bumped"/more rich)
- [ ] Apple emailed 2026-07-13: issue with Lexly Mac submission (ID 02681c16-1551-43e4-8fa0-154510d89508, submitted Jul 06) — read full email / Resolution Center, likely same 2.1 course-load issue as iOS; fix + resubmit
