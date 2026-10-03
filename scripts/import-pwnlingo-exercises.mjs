#!/usr/bin/env node
// Imports real Duolingo exercises captured by the sibling Cruise repo
// (scripts/lessons.jsonl + lessons.archive.jsonl) into Lexly language courses.
// Existing hand-written courses are never touched: captured drills go into
// extra units whose ids start with "pw", and a re-run replaces only those.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, '..', 'cruise', 'scripts');
const coursesDir = path.join(root, 'content', 'courses');

// pwnlingo track code -> Lexly course id. NEW entries only matter for courses Lexly lacks.
const COURSES = { hi: 'hindi', ja: 'japanese', ko: 'korean', ar: 'arabic', zh: 'chinese', fr: 'french', ru: 'russian', pt: 'portuguese', es: 'spanish', de: 'german', it: 'italian', nl: 'dutch', tlh: 'klingon', yi: 'yiddish', id: 'indonesian' };
const NEW = {
  indonesian: { name: 'Indonesian', lang: 'id-ID', icon: 'fa-solid fa-earth-asia' },
};
const CAP = 500;          // ponytail: per course, keeps packs small; raise when the app pages units
const MIN = 10;          // fewer captured drills than one lesson isn't worth a unit
const LESSON_SIZE = 10;
const UNIT_SIZE = 5;

const clean = (s) => (typeof s === 'string' ? s.trim() : '');
// Old match rows only kept the narration "door is दरवाज़ा. why is क्यों"; recover the pairs from it.
const pairsFrom = (r) => {
  if (Array.isArray(r.pairs)) return r.pairs.filter((p) => clean(p[0]) && clean(p[1])).map((p) => [clean(p[0]), clean(p[1])]);
  if (r.via !== 'pairs' || !r.prompt) return [];
  return r.prompt.split('. ').map((s) => s.split(' is ')).filter((p) => p.length === 2 && clean(p[0]) && clean(p[1])).map((p) => [clean(p[0]), clean(p[1])]);
};

// Turn one ledger row into one Lexly exercise (without id), or null.
export const toExercise = (r, pool) => {
  const pairs = pairsFrom(r);
  if (pairs.length >= 2) return { type: 'match', question: 'Tap the matching pairs', answer: 'matched', pairs };
  const q = clean(r.prompt), a = clean(r.answer);
  if (!q || !a || q === a) return null;
  const choices = Array.isArray(r.choices) ? [...new Set(r.choices.map(clean).filter(Boolean))] : [];
  if (choices.length >= 2 && choices.includes(a)) return { type: q.includes('___') ? 'cloze' : 'translation', question: q, answer: a, choices };
  const words = a.split(/\s+/);
  if (words.length < 2) return null;
  const latin = (w) => !/[^\x00-\x7F]/.test(w);
  const extra = pool.filter((w) => !words.includes(w) && latin(w) === latin(words[0])).slice(0, 2);   // two distractors, same script as the answer
  return { type: 'sentence', question: q, answer: a, words: [...words, ...extra] };
};

const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n') : []);
const byCourse = {};
for (const line of [...read(path.join(src, 'lessons.archive.jsonl')), ...read(path.join(src, 'lessons.jsonl'))]) {
  if (!line.trim()) continue;
  let r; try { r = JSON.parse(line); } catch { continue; }
  const id = COURSES[r.course];
  if (id) (byCourse[id] ||= []).push(r);
}

const catalogPath = path.join(root, 'content', 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const languages = catalog.categories.languages.subjects;

for (const [id, rows] of Object.entries(byCourse)) {
  const file = path.join(coursesDir, `${id}.json`);
  if (!fs.existsSync(file) && !NEW[id]) continue;
  const pool = [...new Set(rows.flatMap((r) => clean(r.answer).split(/\s+/)).filter(Boolean))];
  const seen = new Set(), ex = [];
  for (const r of rows) {
    const e = toExercise(r, pool.slice((seen.size * 7) % Math.max(pool.length - 2, 1)));
    if (!e) continue;
    const key = e.type === 'match' ? JSON.stringify(e.pairs) : `${e.question}\u0000${e.answer}`;
    if (seen.has(key)) continue;
    seen.add(key); ex.push(e);
    if (ex.length >= CAP) break;
  }
  if (ex.length < MIN) continue;

  const course = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, 'utf8'))
    : { id, name: NEW[id].name, category: 'languages', icon: NEW[id].icon, level: 'Beginner', lang: NEW[id].lang, version: 1, units: [] };
  course.units = course.units.filter((u) => !String(u.id).startsWith('pw'));
  for (let u = 0; u * UNIT_SIZE * LESSON_SIZE < ex.length; u++) {
    const lessons = [];
    for (let l = 0; l < UNIT_SIZE; l++) {
      const start = (u * UNIT_SIZE + l) * LESSON_SIZE;
      const chunk = ex.slice(start, start + LESSON_SIZE);
      if (!chunk.length) break;
      lessons.push({ id: `pw${u + 1}l${l + 1}`, title: `Real drills ${start + 1}-${start + chunk.length}`, exercises: chunk.map((e, i) => ({ ...e, id: `${id}_pw${u + 1}l${l + 1}_${i}` })) });
    }
    course.units.push({ id: `pw${u + 1}`, title: `Real drills ${u + 1}`, lessons });
  }
  fs.writeFileSync(file, JSON.stringify(course, null, 2) + '\n');
  console.log(`${id}: ${ex.length} captured exercises in ${Math.ceil(ex.length / (UNIT_SIZE * LESSON_SIZE))} units`);
  if (!languages.some((s) => s.id === id)) languages.push({ id, name: course.name, icon: course.icon, level: 'Beginner', packPath: `/content/courses/${id}.json`, lang: course.lang });
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log('catalog.json updated');
