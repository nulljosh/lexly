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
