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

check(typeof catalog.categories === 'object', 'catalog.categories must be an object');

for (const [catId, category] of Object.entries(catalog.categories)) {
  check(typeof category.title === 'string', `${catId}: missing title`);
  check(Array.isArray(category.subjects), `${catId}: subjects must be an array`);
  for (const subject of category.subjects || []) {
    check(typeof subject.id === 'string', `${catId}: subject missing id`);
    check(typeof subject.name === 'string', `${catId}/${subject.id}: missing name`);
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
      check(Array.isArray(unit.lessons), `${catId}/${subject.id}: unit missing lessons array`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} catalog validation failure(s)`);
  process.exit(1);
}
console.log('catalog.json: all categories/subjects/packs valid');
