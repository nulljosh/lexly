#!/usr/bin/env node
// Regression check for the cross-course lesson-completion bug: completing a
// lesson in one course must never mark a same-id lesson in another course
// as complete. Loads the real js/lingo-app.js in a sandboxed VM with stub
// browser globals and exercises loadProgress/saveProgress/isLessonComplete
// directly, so this fails if the storage keying regresses.
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

// --- exercise the bug scenario ---------------------------------------------
// Two different courses that happen to share the same lesson id ("u1l1"),
// mirroring content/courses/french.json and content/courses/logic.json.
// `let gameState`/top-level bindings in a vm context aren't exposed as
// sandbox properties, so poke/read them with runInContext instead.
// Drive the same read-modify-write path showResults() uses for crowning a
// lesson, without pulling in the rest of showResults' DOM rendering (games.js
// helpers like isGameCategory aren't loaded in this sandbox).
vm.runInContext(`
    gameState.selectedSubject = 'french';
    gameState.selectedLesson = 'u1l1';
    gameState.hearts = 3; // survived, so the lesson should be crowned

    const progress = loadProgress();
    const lessonsCompleted = { ...progress.lessons_completed };
    if (gameState.selectedLesson && gameState.hearts > 0) {
        lessonsCompleted[gameState.selectedSubject] = {
            ...(lessonsCompleted[gameState.selectedSubject] || {}),
            [gameState.selectedLesson]: true,
        };
    }
    saveProgress({ lessons_completed: lessonsCompleted });
`, sandbox);

assert.strictEqual(
    vm.runInContext("isLessonComplete('french', 'u1l1')", sandbox), true,
    'french/u1l1 should be marked complete after finishing it'
);
assert.strictEqual(
    vm.runInContext("isLessonComplete('logic', 'u1l1')", sandbox), false,
    'BUG: completing french/u1l1 incorrectly marked logic/u1l1 complete too'
);
assert.strictEqual(
    vm.runInContext("isLessonComplete('math', 'u1l1')", sandbox), false,
    'BUG: completing french/u1l1 incorrectly marked math/u1l1 complete too'
);

console.log('PASS: lesson completion is scoped per course, no cross-course collision');
