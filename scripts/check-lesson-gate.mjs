// Self-check for lessonPassed() in js/lingo-app.js.
//
// lingo-app.js is a classic browser script, not a module, so it cannot be
// imported. Pull the one pure function out of the source and exercise it.
// Run: node scripts/check-lesson-gate.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'js/lingo-app.js'), 'utf8');

const ratio = src.match(/const LESSON_PASS_RATIO = ([\d.]+);/);
const fnSrc = src.match(/function lessonPassed\([\s\S]*?\n}/);
assert.ok(ratio, 'LESSON_PASS_RATIO not found in js/lingo-app.js');
assert.ok(fnSrc, 'lessonPassed() not found in js/lingo-app.js');

const lessonPassed = new Function(
  `const LESSON_PASS_RATIO = ${ratio[1]};\n${fnSrc[0]}\nreturn lessonPassed;`
)();

// The bug this guards: skipping every question left hearts intact and zero
// correct, and the lesson was crowned anyway.
assert.equal(lessonPassed(0, 10, 5), false, 'zero correct must never pass');
assert.equal(lessonPassed(10, 10, 5), true, 'all correct must pass');
assert.equal(lessonPassed(6, 10, 5), true, 'exactly at threshold must pass');
assert.equal(lessonPassed(5, 10, 5), false, 'below threshold must fail');
assert.equal(lessonPassed(10, 10, 0), false, 'no hearts must fail regardless');
// Short packs are where surviving proved nothing: 2 questions, both wrong.
assert.equal(lessonPassed(0, 2, 3), false, 'short pack, none correct, must fail');
assert.equal(lessonPassed(2, 2, 3), true, 'short pack, all correct, must pass');
assert.equal(lessonPassed(0, 0, 5), false, 'empty lesson must not pass');

console.log('lesson gate ok');
