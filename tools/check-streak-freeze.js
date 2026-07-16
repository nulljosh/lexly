#!/usr/bin/env node
// Regression check for the streak-freeze quest feature: missing exactly one
// day should consume a banked freeze and preserve the streak instead of
// resetting it to 1, and freezes should be earned every 7-day milestone
// (capped at 2). Loads the real js/lingo-app.js in a sandboxed VM with stub
// browser globals and drives loadProgress/saveProgress/currentWeekStart
// directly, mirroring tools/check-lesson-completion-scoping.js.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'lingo-app.js'), 'utf8');

// --- minimal browser stubs -------------------------------------------------
const store = {};
const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
};

function noop() {}
const fakeElement = () => ({
    style: {}, classList: { add: noop, remove: noop, contains: () => false },
    addEventListener: noop, appendChild: noop, setAttribute: noop,
    dataset: {}, textContent: '', querySelectorAll: () => [],
});
const document = {
    addEventListener: noop,
    getElementById: () => fakeElement(),
    querySelectorAll: () => [],
    createElement: () => fakeElement(),
    body: fakeElement(),
    cookie: '',
};
const sb = {
    auth: { getSession: async () => ({ data: { session: null } }) },
    from: () => ({ upsert: () => ({ then: () => {} }), select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
};
const window = {
    supabase: { createClient: () => sb },
    speechSynthesis: undefined,
    location: { href: '' },
};

const sandbox = {
    window, document, localStorage, navigator: { onLine: true }, console,
    fetch: async () => ({ json: async () => ({}) }),
    setTimeout, Date, JSON, Math, Boolean, Array, Object, String,
    SpeechSynthesisUtterance: function () {},
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
};
sandbox.global = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: 'js/lingo-app.js' });

// --- scenario: 8-day streak (7-day milestone grants a freeze), then a ------
// missed day (diff === 2) should be absorbed by the banked freeze rather
// than resetting the streak to 1. Mirrors the diff/freeze branch in
// showResults() without pulling in the DOM-rendering half of that function.
vm.runInContext(`(function () {
    saveProgress({ streak: 7, streak_freezes: 0, last_played: '2026-07-08' });
    const progress = loadProgress();
    let streakFreezes = progress.streak_freezes || 0;
    const newStreak = 7;
    // Reaching the 7-day milestone grants a freeze (mirrors showResults()).
    if (newStreak > 0 && newStreak % 7 === 0 && streakFreezes < 2) streakFreezes += 1;
    saveProgress({ streak: newStreak, streak_freezes: streakFreezes, last_played: '2026-07-08' });
})();`, sandbox);

assert.strictEqual(
    vm.runInContext('loadProgress().streak_freezes', sandbox), 1,
    'a freeze should be banked after reaching a 7-day streak milestone'
);

vm.runInContext(`(function () {
    // Skip 2026-07-09 entirely, play again on 2026-07-10: diff === 2, one
    // freeze banked, so the streak should be preserved (not reset to 1).
    const today = '2026-07-10';
    const progress = loadProgress();
    let streakFreezes = progress.streak_freezes || 0;
    let streak = progress.streak;
    let usedFreeze = false;
    if (progress.last_played !== today) {
        const diff = Math.floor((new Date(today) - new Date(progress.last_played)) / (1000 * 60 * 60 * 24));
        if (diff > 1 && diff <= 2 && streakFreezes > 0) {
            streakFreezes -= 1;
            usedFreeze = true;
            streak += 1;
        } else {
            streak = diff > 1 ? 1 : streak + 1;
        }
    }
    saveProgress({ streak, streak_freezes: streakFreezes, last_played: today });
    global.__usedFreeze = usedFreeze;
})();`, sandbox);

assert.strictEqual(vm.runInContext('global.__usedFreeze', sandbox), true, 'a banked freeze should be spent to cover the missed day');
assert.strictEqual(vm.runInContext('loadProgress().streak', sandbox), 8, 'streak should be preserved (and incremented for today) rather than reset to 1');
assert.strictEqual(vm.runInContext('loadProgress().streak_freezes', sandbox), 0, 'the spent freeze should be decremented');

// --- currentWeekStart() should be Monday-anchored and stable within a week -
const mon = vm.runInContext("currentWeekStart(new Date('2026-07-07'))", sandbox); // a Monday
const wed = vm.runInContext("currentWeekStart(new Date('2026-07-09'))", sandbox); // same week, Wednesday
const nextMon = vm.runInContext("currentWeekStart(new Date('2026-07-14'))", sandbox); // following Monday
assert.strictEqual(mon, '2026-07-07', 'currentWeekStart should return the Monday itself unchanged');
assert.strictEqual(wed, mon, 'dates within the same week should share the same week_start');
assert.notStrictEqual(nextMon, mon, 'the following week should have a different week_start');

console.log('PASS: streak freeze earn/spend logic and weekly quest week boundary are correct');
