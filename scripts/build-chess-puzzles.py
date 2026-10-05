#!/usr/bin/env python3
# Appends tactics-puzzle units to content/courses/chess.json from the Lichess
# puzzle database (CC0, https://database.lichess.org/#puzzles).
#
# Only one-move puzzles: Lichess stores the position BEFORE the opponent's
# move, so Moves[0] is applied here and Moves[1] is the answer. Each puzzle is
# a `chess` exercise: a FEN to draw, and four moves in SAN to pick from.
# Distractors are legal moves (checks and captures first, so they look
# plausible) and never also mate, since Lichess accepts any mate in one.
#
# The 307MB database is streamed and never written to disk; reading stops as
# soon as every theme bucket is full.
#
#   uv run --with chess scripts/build-chess-puzzles.py          build
#   uv run --with chess scripts/build-chess-puzzles.py --check  replay what is in chess.json
import csv, io, json, random, subprocess, sys
from pathlib import Path
import chess

ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / 'content' / 'courses' / 'chess.json'
URL = 'https://database.lichess.org/lichess_db_puzzle.csv.zst'
PREFIX = 'lp'          # unit ids, so a re-run replaces only these
PER_LESSON, LESSONS = 5, 3
PER_UNIT = PER_LESSON * LESSONS

# theme -> (unit title, tip). In teaching order. Forks, skewers, deflections and
# the like almost never resolve in ONE move, so they stay out until the exercise
# can take a line of moves.
UNITS = [
    ('mateIn1', 'Mate in One', 'Look at every check first. Mate is a check the king cannot escape, block or capture.'),
    ('hangingPiece', 'Free Pieces', 'Before anything clever, ask what is undefended. A piece nobody protects can just be taken.'),
    ('backRankMate', 'Back Rank Mates', 'A king boxed in by its own pawns dies to a rook or queen on the last rank.'),
    ('pin', 'Pins', 'A piece that cannot move without exposing something bigger behind it is pinned. Attack it again.'),
    ('discoveredAttack', 'Discovered Attacks', 'Move one piece out of the way and the one behind it attacks. Two threats from one move.'),
    ('promotion', 'Promotion', 'A pawn on the last rank becomes a queen. Sometimes a knight is better, so check both.'),
]
RATING = (600, 1900)
GLYPH = {'P': 'pawn', 'N': 'knight', 'B': 'bishop', 'R': 'rook', 'Q': 'queen', 'K': 'king'}


def exercise(row, theme, rnd):
    fen, moves = row['FEN'], row['Moves'].split()
    if len(moves) != 2:
        return None
    board = chess.Board(fen)
    board.push_uci(moves[0])
    best = chess.Move.from_uci(moves[1])
    if best not in board.legal_moves:
        return None
    answer = board.san(best)
    mates = lambda m: (board.push(m), board.is_checkmate(), board.pop())[1]
    if theme == 'mateIn1' and not mates(best):
        return None
    others = [m for m in board.legal_moves if m != best and not mates(m)]
    if len(others) < 3:
        return None
    loud = [m for m in others if board.is_capture(m) or board.gives_check(m)]
    quiet = [m for m in others if m not in loud]
    rnd.shuffle(loud); rnd.shuffle(quiet)
    picks = [board.san(m) for m in (loud + quiet)[:3]]
    side = 'White' if board.turn else 'Black'
    piece = GLYPH[board.piece_at(best.from_square).symbol().upper()]
    return {
        'type': 'chess',
        'question': f'{side} to move. Find the best move.',
        'fen': board.fen(),
        'answer': answer,
        'choices': [answer] + picks,
        'explain': f'{answer}: the {piece} move wins here. Lichess puzzle {row["PuzzleId"]}, rated {row["Rating"]}.',
        '_rating': int(row['Rating']),
    }


def build():
    rnd = random.Random(7)
    want = {t for t, _, _ in UNITS}
    buckets = {t: [] for t in want}
    target = PER_UNIT * 4          # a wider pool, then keep an even spread of ratings
    proc = subprocess.Popen(f'curl -sL {URL} | zstd -dc', shell=True, stdout=subprocess.PIPE)
    for row in csv.DictReader(io.TextIOWrapper(proc.stdout, encoding='utf-8')):
        if not (RATING[0] <= int(row['Rating']) <= RATING[1]) or int(row['Popularity']) < 50:
            continue
        themes = row['Themes'].split()
        # Rarest bucket first, so a puzzle tagged mateIn1 and fork feeds forks.
        for theme in sorted((t for t in themes if t in want and len(buckets[t]) < target), key=lambda t: len(buckets[t])):
            ex = exercise(row, theme, rnd)
            if ex:
                buckets[theme].append(ex); break
        if all(len(b) >= target for b in buckets.values()):
            break
    proc.kill()

    pack = json.loads(PACK.read_text())
    pack['units'] = [u for u in pack['units'] if not str(u['id']).startswith(PREFIX)]
    slot = 0
    for n, (theme, title, tip) in enumerate(UNITS, 1):
        pool = sorted(buckets[theme], key=lambda e: e['_rating'])
        if len(pool) < PER_UNIT:
            print(f'skip {theme}: only {len(pool)} puzzles', file=sys.stderr); continue
        step = len(pool) / PER_UNIT
        chosen = [pool[int(i * step)] for i in range(PER_UNIT)]   # easiest to hardest, evenly across the pool
        lessons = []
        for l in range(LESSONS):
            exs = []
            for i, ex in enumerate(chosen[l * PER_LESSON:(l + 1) * PER_LESSON]):
                ex = {k: v for k, v in ex.items() if k != '_rating'}
                # Answer slot rotates 0..3 so it never sits in one position.
                c = [x for x in ex['choices'] if x != ex['answer']]
                c.insert(slot % 4, ex['answer']); slot += 1
                ex['choices'] = c
                ex['id'] = f'chess_{PREFIX}{n}l{l + 1}_{i}'
                exs.append(ex)
            lessons.append({'id': f'{PREFIX}{n}l{l + 1}', 'title': f'Puzzles {l + 1}', 'exercises': exs})
        pack['units'].append({'id': f'{PREFIX}{n}', 'title': title, 'tip': tip, 'lessons': lessons})
        print(f'{title}: {PER_UNIT} puzzles, rated {chosen[0]["_rating"]}-{chosen[-1]["_rating"]}', file=sys.stderr)
    pack['version'] = pack.get('version', 1) + 1
    PACK.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + '\n')


def check():
    pack = json.loads(PACK.read_text())
    n = 0
    for u in pack['units']:
        if not str(u['id']).startswith(PREFIX):
            continue
        for l in u['lessons']:
            for ex in l['exercises']:
                b = chess.Board(ex['fen'])
                legal = {b.san(m): m for m in b.legal_moves}
                assert ex['answer'] in ex['choices'] and len(set(ex['choices'])) == 4, ex['id']
                assert all(c in legal for c in ex['choices']), f"{ex['id']}: illegal choice"
                for c in ex['choices']:
                    b.push(legal[c]); mate = b.is_checkmate(); b.pop()
                    assert not (mate and c != ex['answer']), f"{ex['id']}: distractor {c} also mates"
                    if u['title'] == 'Mate in One' and c == ex['answer']:
                        assert mate, f"{ex['id']}: answer does not mate"
                n += 1
    assert n, 'no puzzle exercises found'
    print(f'chess puzzles ok: {n} replayed')


if __name__ == '__main__':
    check() if '--check' in sys.argv else build()
