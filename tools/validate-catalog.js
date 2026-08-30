#!/usr/bin/env node
// ponytail: smoke test, not a full validator. Catches broken catalog/course JSON before shipping.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const catalogPath = path.join(root, 'content', 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

let failures = 0;
function check(cond, msg) {
  if (!cond) {
    failures++;
    console.error('FAIL:', msg);
  }
}

// Every renderable exercise type, and the fields its renderers actually read on BOTH
// platforms. This exists because the Swift Exercise model silently dropped `words` and
// `audio`: word-bank exercises rendered as an empty text field and listening exercises
// had no audio, and nothing failed -- the JSON was valid, it just decoded to less.
const EXERCISE_TYPES = {
  translation:  ['choices'],
  mathChoice:   ['choices'],
  cloze:        ['choices'],
  math:         [],
  sentence:     ['words'],
  listening:    ['audio'],
  match:        ['pairs'],
};

function checkExerciseType(ex, where) {
  const required = EXERCISE_TYPES[ex.type];
  if (!required) {
    check(false, `${where}: unknown exercise type "${ex.type}" — no renderer on web or iOS`);
    return;
  }
  for (const field of required) {
    // `audio` is a string of text to speak; the rest are arrays.
    const ok = field === 'audio'
      ? typeof ex[field] === 'string' && ex[field].length > 0
      : Array.isArray(ex[field]) && ex[field].length > 0;
    check(ok, `${where}: ${ex.type} exercise missing non-empty "${field}"`);
  }
  if (required.includes('choices') && Array.isArray(ex.choices)) {
    check(ex.choices.includes(ex.answer), `${where}: ${ex.type} choices do not contain the answer "${ex.answer}"`);
    check(new Set(ex.choices).size === ex.choices.length, `${where}: ${ex.type} has duplicate choices`);
  }
  // A word bank the answer can't be built from is unanswerable. Compare whitespace
  // tokens, not whole chips: a chip may legitimately hold several words (the Python
  // course banks "x > 0" as one chip).
  if (ex.type === 'sentence' && Array.isArray(ex.words)) {
    const bank = ex.words.flatMap((chip) => String(chip).split(/\s+/));
    for (const word of String(ex.answer).split(/\s+/).filter(Boolean)) {
      const at = bank.indexOf(word);
      check(at >= 0, `${where}: word bank is missing "${word}" from the answer`);
      if (at >= 0) bank.splice(at, 1);
    }
  }
  if (ex.type === 'match' && Array.isArray(ex.pairs)) {
    check(ex.pairs.length >= 2, `${where}: match needs at least 2 pairs`);
    for (const pair of ex.pairs) {
      check(Array.isArray(pair) && pair.length === 2 && pair.every((side) => typeof side === 'string' && side),
        `${where}: match pair must be [prompt, answer]`);
    }
  }
  // An answer identical to its own prompt is usually an untranslated row, but not
  // always -- "Water" really is the Dutch for water. Warn, don't fail; the generator
  // filters these out at the source.
  if (String(ex.answer).toLowerCase() === String(ex.question).toLowerCase()) {
    console.warn('WARN:', `${where}: answer is identical to the question ("${ex.answer}")`);
  }
}

check(typeof catalog.categories === 'object', 'catalog.categories must be an object');

for (const [catId, category] of Object.entries(catalog.categories)) {
  check(typeof category.title === 'string', `${catId}: missing title`);
  check(Array.isArray(category.subjects), `${catId}: subjects must be an array`);
  for (const subject of category.subjects || []) {
    check(typeof subject.id === 'string', `${catId}: subject missing id`);
    check(typeof subject.name === 'string', `${catId}/${subject.id}: missing name`);
    if (subject.notesPath) {
      check(fs.existsSync(path.join(root, subject.notesPath)), `${catId}/${subject.id}: notesPath target not found at ${subject.notesPath}`);
      continue;
    }
    if (subject.url) {
      check(fs.existsSync(path.join(root, subject.url)), `${catId}/${subject.id}: url target not found at ${subject.url}`);
      continue;
    }
    check(typeof subject.packPath === 'string', `${catId}/${subject.id}: missing packPath`);
    const packFile = path.join(root, subject.packPath);
    if (!fs.existsSync(packFile)) {
      check(false, `${catId}/${subject.id}: pack file not found at ${subject.packPath}`);
      continue;
    }
    let pack;
    try {
      pack = JSON.parse(fs.readFileSync(packFile, 'utf8'));
    } catch (e) {
      check(false, `${catId}/${subject.id}: pack file is not valid JSON (${e.message})`);
      continue;
    }
    check(Array.isArray(pack.units), `${catId}/${subject.id}: pack missing units array`);
    for (const unit of pack.units || []) {
      // Optional teaching fields. Both renderers read them, so both shapes are guarded.
      if (unit.tip !== undefined) {
        check(typeof unit.tip === 'string' && unit.tip.trim().length > 0,
          `${catId}/${subject.id}/${unit.id}: tip must be a non-empty string`);
      }
      if (unit.preview !== undefined) {
        check(Array.isArray(unit.preview) && unit.preview.length > 0,
          `${catId}/${subject.id}/${unit.id}: preview must be a non-empty array`);
        for (const pair of unit.preview || []) {
          check(Array.isArray(pair) && pair.length === 2 && pair.every((side) => typeof side === 'string' && side.trim()),
            `${catId}/${subject.id}/${unit.id}: preview entry must be [english, target]`);
        }
      }
      check(Array.isArray(unit.lessons), `${catId}/${subject.id}: unit missing lessons array`);
      for (const lesson of unit.lessons || []) {
        check(typeof lesson.id === 'string' && typeof lesson.title === 'string', `${catId}/${subject.id}/${unit.id}: lesson missing id/title`);
        check(Array.isArray(lesson.exercises), `${catId}/${subject.id}/${lesson.id}: lesson missing exercises array`);
        for (const ex of lesson.exercises || []) {
          // iOS Exercise model requires all four as strings; missing any makes the whole course fail to load
          for (const key of ['type', 'question', 'answer', 'id']) {
            check(typeof ex[key] === 'string', `${catId}/${subject.id}/${lesson.id}: exercise missing string "${key}"`);
          }
          if (ex.choices !== undefined) check(Array.isArray(ex.choices), `${catId}/${subject.id}/${lesson.id}: exercise choices must be an array`);
          checkExerciseType(ex, `${catId}/${subject.id}/${lesson.id}`);
        }
      }
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} catalog validation failure(s)`);
  process.exit(1);
}
console.log('catalog.json: all categories/subjects/packs valid');
