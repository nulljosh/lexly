# Tonchi loop handoff (2026-10-05, 18:00)

## What the loop is

Self-paced loop building Tonchi alongside Cruise. Each round: 1) Cruise health (runner alive, XP rising, streak extended, disk above 3GB, new milestone.jsonl lines); fix real breakage first. 2) Pick next Tonchi roadmap item using open sources only (Tatoeba, Lichess CC0, original), never Duolingo's captured sentences/structure. Examples: fact-check held Greek/Polish packs so they can go catalog; Android chess board UI; step-by-step chess lines; ATTRIBUTION.md accuracy; Cruise gift/chest selectors once Duolingo shows one. 3) Run every Tonchi check (validate-catalog, streak-freeze, lesson-completion-scoping, lesson-gate, chess --check, macOS build on Swift changes), then commit, push, confirm CI green, sync README/roadmap/landing. 4) Reply 1-2 line TLDR. No App Store submissions, no deletes of existing content, at most one Haiku subagent per round.

## Where things stand

Cruise at 470k XP (goal 500k by end of day then 1M), watchdog restart 5s, streak guard plays language after 6pm zero-XP, switched to Polish default (1,307 XP/hr vs chess 522), disk cleaned to 6.9GB. Tonchi expanded to 165+ courses with Tatoeba CC-BY sentences ordered by Cruise vocabulary: Greek/Polish 120 units each, Hindi 55, Japanese 49, Korean 43, French 36. Chess puzzles added (195 Lichess CC0 puzzles, FEN board on iOS/macOS), 13 units, every one replayed with python-chess. ATTRIBUTION.md outdated: restored Hindi/Japanese/Korean/French/Arabic drill units contradict the "no third-party app content" claim. Greek/Polish packs held off catalog pending fact-check. Duolingo-captured drills were removed earlier; pre-existing drill units restored per Josh's request.

## Next, in order

1. Step-by-step chess lines: a combination is one question about its first move today; an exercise where the board answers back would teach the follow-up
2. ATTRIBUTION.md still says no third-party app content is used; the restored Hindi/Japanese/Korean/French/Arabic drill units contradict that
3. Cruise gift/chest selectors once Duolingo shows one (gift-sent and chest-open log entries)
4. Russian (speaking exercises) and Arabic (characterMatch pair-select) earn no XP; investigate if worth fixing
5. Chess course stub units (6 hand-written multiple-choice units) could use more original content

Done since the handoff was written: Polish, Greek, Turkish and Swedish fact-checked and in the catalog (2026-10-05); Android draws the chess board (compiles with JDK 17 at /opt/homebrew/opt/openjdk@17).

## Restart prompt

```
/loop Keep building Cruise and Tonchi, one shippable slice per round. Each round: 1) Cruise health: runner alive, XP rising, streak extended today, disk above 3GB, new lines in scripts/milestones.jsonl; fix real breakage first. 2) Pick the next Tonchi item from its roadmap.md that uses open sources only (Tatoeba, Lichess CC0, original content), never Duolingo's captured sentences or exercise structure: e.g. multi-move chess puzzles for forks/skewers, fact-checking held-off language packs so they can go back in the catalog, more units for logged languages, Android support for chess. 3) Run every Tonchi check (validate-catalog, streak-freeze, lesson-completion-scoping, lesson-gate, chess --check, macOS build when Swift changes), then commit, push, confirm CI green, sync README/roadmap/landing. 4) Reply with a 1-2 line TLDR. No App Store submissions, no deletes of existing content, at most one Haiku subagent at a time.
```
