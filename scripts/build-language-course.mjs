#!/usr/bin/env node
// Builds language course packs from Tatoeba sentence pairs, ranked by word frequency.
//
// Sources (both permissive, both credited in ATTRIBUTION.md):
//   Tatoeba sentence pairs      CC-BY 2.0 FR   https://tatoeba.org
//   hermitdave/FrequencyWords   MIT            OpenSubtitles-derived frequency lists
//
// Generated units are APPENDED after the hand-authored ones, never replacing them, so
// existing exercise ids stay valid and committed SRS cards / lessons_completed keys
// don't orphan.
//
// Usage:  node scripts/build-language-course.mjs [lang-id ...]     (default: all)

import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, 'cache/tatoeba');
const COURSES = path.join(ROOT, 'content/courses');

// tatoeba: ISO 639-3 code on downloads.tatoeba.org
// freq:    directory in hermitdave/FrequencyWords ('2016' where 2018 has no list)
const LANGS = {
    spanish:    { tatoeba: 'spa', freq: 'es', freqYear: '2018' },
    french:     { tatoeba: 'fra', freq: 'fr', freqYear: '2018' },
    german:     { tatoeba: 'deu', freq: 'de', freqYear: '2018' },
    italian:    { tatoeba: 'ita', freq: 'it', freqYear: '2018' },
    portuguese: { tatoeba: 'por', freq: 'pt', freqYear: '2018' },
    dutch:      { tatoeba: 'nld', freq: 'nl', freqYear: '2018' },
    russian:    { tatoeba: 'rus', freq: 'ru', freqYear: '2018' },
    korean:     { tatoeba: 'kor', freq: 'ko', freqYear: '2018' },
    arabic:     { tatoeba: 'ara', freq: 'ar', freqYear: '2018' },
    japanese:   { tatoeba: 'jpn', freq: 'ja', freqYear: '2016' },
    chinese:    { tatoeba: 'cmn', freq: 'zh', freqYear: '2016' },
    hindi:      { tatoeba: 'hin', freq: 'hi', freqYear: '2016' },
};

// Scripts without spaces between words: whitespace tokenizing is meaningless, so these
// rank by character count and skip the cloze exercise (which needs a word to blank).
const UNSPACED = new Set(['japanese', 'chinese']);

const UNITS = 10;
const MIN_UNITS = 3;
const LESSONS_PER_UNIT = 3;
// One lesson consumes: translation 1 + cloze 1 + sentence 1 + listening 1 + match 4.
const SENTENCES_PER_LESSON = 8;
const PER_UNIT = LESSONS_PER_UNIT * SENTENCES_PER_LESSON;

// Difficulty ladder, one name per unit. Units are ordered by vocabulary difficulty and
// nothing else, so the names say difficulty and nothing else -- an earlier pass named
// them by topic ("Food & Drink") and every unit was full of unrelated sentences.
const UNIT_NAMES = [
    'Common Words 1', 'Common Words 2', 'Short Sentences 1', 'Short Sentences 2',
    'Everyday Speech 1', 'Everyday Speech 2', 'Wider Vocabulary 1', 'Wider Vocabulary 2',
    'Longer Sentences 1', 'Longer Sentences 2',
];

async function exists(file) {
    try { await access(file); return true; } catch { return false; }
}

async function fetchTo(url, dest) {
    if (await exists(dest)) return dest;
    process.stderr.write(`  fetch ${path.basename(url)}\n`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    await writeFile(dest, Buffer.from(await response.arrayBuffer()));
    return dest;
}

// Node's zlib has no bzip2. macOS/Linux ship bunzip2, so shell out rather than take a dep.
async function fetchBz2(url, name) {
    const plain = path.join(CACHE, name);
    if (await exists(plain)) return plain;
    const archive = `${plain}.bz2`;
    await fetchTo(url, archive);
    await run('bunzip2', ['-kf', archive]);
    return plain;
}

async function loadSentences(code) {
    const file = await fetchBz2(
        `https://downloads.tatoeba.org/exports/per_language/${code}/${code}_sentences.tsv.bz2`,
        `${code}_sentences.tsv`,
    );
    const byId = new Map();
    for (const line of (await readFile(file, 'utf8')).split('\n')) {
        const [id, , text] = line.split('\t');
        if (id && text) byId.set(id, text);
    }
    return byId;
}

async function loadFrequency({ freq, freqYear }) {
    const file = path.join(CACHE, `${freq}_${freqYear}_50k.txt`);
    await fetchTo(
        `https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/${freqYear}/${freq}/${freq}_50k.txt`,
        file,
    );
    const rank = new Map();
    (await readFile(file, 'utf8')).split('\n').forEach((line, index) => {
        const word = line.split(' ')[0];
        if (word && !rank.has(word)) rank.set(word, index);
    });
    return rank;
}

const tokenize = (text) =>
    text.toLowerCase().replace(/[^\p{L}\p{N}\s'-]/gu, '').split(/\s+/).filter(Boolean);

// Ranked pairs, easiest first. "Easiest" = the rarest word in the target sentence is
// still common; that keeps unit 1 off vocabulary nobody needs.
async function rankedPairs(id, config) {
    const [target, english, rank] = await Promise.all([
        loadSentences(config.tatoeba),
        loadSentences('eng'),
        loadFrequency(config),
    ]);
    const linksFile = await fetchBz2(
        `https://downloads.tatoeba.org/exports/per_language/${config.tatoeba}/${config.tatoeba}-eng_links.tsv.bz2`,
        `${config.tatoeba}-eng_links.tsv`,
    );

    const unspaced = UNSPACED.has(id);
    const seen = new Set();
    const pairs = [];

    for (const line of (await readFile(linksFile, 'utf8')).split('\n')) {
        const [targetId, englishId] = line.split('\t');
        const targetText = target.get(targetId);
        const englishText = english.get(englishId);
        if (!targetText || !englishText) continue;

        const key = englishText.toLowerCase();
        if (seen.has(key)) continue;
        // Tatoeba contains rows where the "translation" is the same string, which would
        // render as a translation exercise whose answer is its own prompt.
        if (targetText.toLowerCase() === key) continue;
        // Quotation marks survive whitespace tokenizing as junk word-bank chips
        // (`\"\u00bfPor`), so drop quoted sentences rather than special-casing them later.
        if (/["\u00ab\u00bb\u201c\u201d]/.test(targetText) || /["\u201c\u201d]/.test(englishText)) continue;

        let difficulty;
        if (unspaced) {
            const length = [...targetText].length;
            if (length < 4 || length > 18) continue;
            difficulty = length;
        } else {
            const words = tokenize(targetText);
            if (words.length < 3 || words.length > 8) continue;
            if (new Set(words).size < 3) continue;
            const ranks = words.map((word) => rank.get(word));
            if (ranks.some((value) => value === undefined)) continue;
            difficulty = Math.max(...ranks);
        }

        seen.add(key);
        pairs.push({ target: targetText, english: englishText, difficulty });
    }

    pairs.sort((a, b) => a.difficulty - b.difficulty);
    return pairs;
}

function shuffle(items, seed) {
    const copy = [...items];
    let state = seed;
    for (let index = copy.length - 1; index > 0; index -= 1) {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        const swap = state % (index + 1);
        [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
}

const distractors = (pool, exclude, count, seed) =>
    shuffle([...new Set(pool)].filter((item) => item !== exclude), seed).slice(0, count);

function buildLesson(id, unitIndex, lessonIndex, chunk, pool, unspaced) {
    const nextId = (() => {
        let counter = 0;
        return () => `${id}_t${unitIndex + 1}_${lessonIndex + 1}_${counter++}`;
    })();
    const seed = unitIndex * 1000 + lessonIndex;
    const targets = pool.map((pair) => pair.target);
    const exercises = [];

    // 1. translation — pick the target sentence for an English prompt
    const first = chunk[0];
    exercises.push({
        type: 'translation',
        question: first.english,
        answer: first.target,
        choices: shuffle([first.target, ...distractors(targets, first.target, 3, seed)], seed + 1),
        id: nextId(),
    });

    // 2. cloze — blank one word. Needs word boundaries, so unspaced scripts get a
    //    second translation instead.
    const second = chunk[1];
    const words = second.target.split(/\s+/);
    const bare = (word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    const blankAt = Math.floor(words.length / 2);
    const answer = bare(words[blankAt]);
    if (!unspaced && words.length >= 3 && answer.length > 1) {
        const wordPool = [...new Set(pool.flatMap((pair) => pair.target.split(/\s+/))
            .map(bare)
            .filter((word) => word.length > 1))];
        exercises.push({
            type: 'cloze',
            question: words.map((word, index) => (index === blankAt ? '____' : word)).join(' '),
            answer,
            choices: shuffle([answer, ...distractors(wordPool, answer, 3, seed + 2)], seed + 3),
            id: nextId(),
        });
    } else {
        exercises.push({
            type: 'translation',
            question: second.english,
            answer: second.target,
            choices: shuffle([second.target, ...distractors(targets, second.target, 3, seed + 2)], seed + 3),
            id: nextId(),
        });
    }

    // 3. sentence — word bank. Unspaced scripts have no tokens to bank, so they get a
    //    listening exercise in its place.
    const third = chunk[2];
    const bank = third.target.split(/\s+/);
    if (!unspaced && bank.length >= 2) {
        const decoyPool = [...new Set(pool.flatMap((pair) => pair.target.split(/\s+/)))];
        exercises.push({
            type: 'sentence',
            question: third.english,
            answer: third.target,
            words: shuffle([...bank, ...distractors(decoyPool, third.target, 2, seed + 4)], seed + 5),
            id: nextId(),
        });
    } else {
        exercises.push({
            type: 'listening', question: 'Type what you hear',
            answer: third.target, audio: third.target, id: nextId(),
        });
    }

    // 4. listening
    const fourth = chunk[3];
    exercises.push({
        type: 'listening', question: 'Type what you hear',
        answer: fourth.target, audio: fourth.target, id: nextId(),
    });

    // 5. match — four pairs
    exercises.push({
        type: 'match',
        question: 'Tap the matching pairs',
        answer: 'matched',
        pairs: chunk.slice(4, 8).map((pair) => [pair.english, pair.target]),
        id: nextId(),
    });

    return { id: `t${unitIndex + 1}l${lessonIndex + 1}`, title: `Lesson ${lessonIndex + 1}`, exercises };
}

async function build(id) {
    const config = LANGS[id];
    const packPath = path.join(COURSES, `${id}.json`);
    const pack = JSON.parse(await readFile(packPath, 'utf8'));

    const pairs = await rankedPairs(id, config);
    // Smaller corpora (Hindi is the thin one) get fewer units rather than no course.
    const units = Math.min(UNITS, Math.floor(pairs.length / PER_UNIT));
    if (units < MIN_UNITS) {
        process.stderr.write(`  ! only ${pairs.length} usable pairs — skipping\n`);
        return null;
    }
    if (units < UNITS) process.stderr.write(`  thin corpus: ${units} units\n`);
    const usable = pairs.slice(0, units * PER_UNIT);
    const unspaced = UNSPACED.has(id);

    // Drop any previously generated units, keep every hand-authored one.
    pack.units = pack.units.filter((unit) => !unit.id.startsWith('t'));

    for (let unitIndex = 0; unitIndex < units; unitIndex += 1) {
        const pool = usable.slice(unitIndex * PER_UNIT, (unitIndex + 1) * PER_UNIT);
        const lessons = [];
        for (let lessonIndex = 0; lessonIndex < LESSONS_PER_UNIT; lessonIndex += 1) {
            const chunk = pool.slice(
                lessonIndex * SENTENCES_PER_LESSON,
                (lessonIndex + 1) * SENTENCES_PER_LESSON,
            );
            lessons.push(buildLesson(id, unitIndex, lessonIndex, chunk, pool, unspaced));
        }
        pack.units.push({ id: `t${unitIndex + 1}`, title: UNIT_NAMES[unitIndex], lessons });
    }

    pack.version = (pack.version || 1) + 1;
    await writeFile(packPath, `${JSON.stringify(pack, null, 2)}\n`);
    return pack.units.reduce((sum, unit) =>
        sum + unit.lessons.reduce((count, lesson) => count + lesson.exercises.length, 0), 0);
}

const requested = process.argv.slice(2);
const targets = requested.length ? requested : Object.keys(LANGS);
await mkdir(CACHE, { recursive: true });

for (const id of targets) {
    if (!LANGS[id]) { process.stderr.write(`unknown language: ${id}\n`); continue; }
    process.stderr.write(`${id}\n`);
    const total = await build(id);
    if (total) process.stderr.write(`  ${total} exercises\n`);
}
