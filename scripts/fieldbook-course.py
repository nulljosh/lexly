#!/usr/bin/env python3
"""Build content/courses/fieldbook.json from ../fieldbook/fields.json.
One unit per domain; per field: 'which field is this?' from the summary,
plus one per key idea. Distractors are sibling fields in the same domain."""
import json, random, pathlib
root = pathlib.Path(__file__).resolve().parents[2]
fields = json.load(open(root / 'fieldbook/fields.json'))
rng = random.Random(7)
by_dom = {}
for f in fields: by_dom.setdefault(f['d'], []).append(f)
names = [f['n'] for f in fields]
def choices(f):
    pool = [x['n'] for x in by_dom[f['d']] if x is not f] or [n for n in names if n != f['n']]
    pool = rng.sample(pool, min(3, len(pool)))
    while len(pool) < 3: pool.append(rng.choice([n for n in names if n != f['n'] and n not in pool]))
    c = pool + [f['n']]; rng.shuffle(c); return c
units, i = [], 0
for di, (dom, fs) in enumerate(sorted(by_dom.items()), 1):
    lessons = []
    for li, f in enumerate(fs, 1):
        ex = [{'type': 'mathChoice', 'question': f'Which field: "{f["s"]}"', 'answer': f['n'], 'choices': choices(f), 'id': f'fieldbook_{i}'}]; i += 1
        for k in f['k']:
            ex.append({'type': 'mathChoice', 'question': f'Which field says: {k}', 'answer': f['n'], 'choices': choices(f), 'id': f'fieldbook_{i}'}); i += 1
        lessons.append({'id': f'u{di}l{li}', 'title': f['n'], 'exercises': ex})
    units.append({'id': f'u{di}', 'title': dom, 'lessons': lessons})
out = {'id': 'fieldbook', 'name': 'Fieldbook', 'category': 'science', 'icon': 'fa-solid fa-compass',
       'level': 'Every field of science and math', 'version': 1, 'units': units}
json.dump(out, open(root / 'lexly/content/courses/fieldbook.json', 'w'), indent=1)
assert i > 300 and all(e['answer'] in e['choices'] and len(set(e['choices'])) == 4 for u in units for l in u['lessons'] for e in l['exercises'])
print(len(units), 'units', i, 'exercises')
