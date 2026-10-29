// Node unit tests for Seating Planner BD logic (js/seating.js, js/i18n.js).
// Run: node tests/test.js — exits non-zero on any failure.
const assert = require('node:assert');
const S = require('../js/seating.js');
const { STR, toBnDigits } = require('../js/i18n.js');

let n = 0;
function ok(name, fn) { fn(); n++; console.log('ok - ' + name); }

// parseNames
ok('parseNames trims, drops blanks, dedupes case-insensitively', () => {
  assert.deepStrictEqual(
    S.parseNames('  Rahim \n\nKarim\nrahim\n  \nFahad '),
    ['Rahim', 'Karim', 'Fahad']);
});
ok('parseNames empty input -> []', () => assert.deepStrictEqual(S.parseNames(''), []));

// countSpacedSeats
ok('spaced seats: 5x5=13, 4x4=8, 3x3=5, 2x3=3, 2x2=2', () => {
  assert.strictEqual(S.countSpacedSeats(5, 5), 13);
  assert.strictEqual(S.countSpacedSeats(4, 4), 8);
  assert.strictEqual(S.countSpacedSeats(3, 3), 5);
  assert.strictEqual(S.countSpacedSeats(2, 3), 3);
  assert.strictEqual(S.countSpacedSeats(2, 2), 2);
});

// validateLayout
ok('validate ok for 5 names in 3x3', () => {
  assert.strictEqual(S.validateLayout(['a', 'b', 'c', 'd', 'e'], 3, 3, 'random').ok, true);
});
ok('validate badSize for rows 1, 11, 2.5, NaN', () => {
  assert.strictEqual(S.validateLayout(['a', 'b'], 1, 3, 'random').error, 'badSize');
  assert.strictEqual(S.validateLayout(['a', 'b'], 11, 3, 'random').error, 'badSize');
  assert.strictEqual(S.validateLayout(['a', 'b'], 2.5, 3, 'random').error, 'badSize');
  assert.strictEqual(S.validateLayout(['a', 'b'], NaN, 3, 'random').error, 'badSize');
});
ok('validate tooFew for 0 and 1 names', () => {
  assert.strictEqual(S.validateLayout([], 3, 3, 'random').error, 'tooFew');
  assert.strictEqual(S.validateLayout(['a'], 3, 3, 'random').error, 'tooFew');
});
ok('validate tooMany reports students and capacity', () => {
  const r = S.validateLayout(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], 3, 3, 'random');
  assert.strictEqual(r.error, 'tooMany');
  assert.strictEqual(r.students, 10);
  assert.strictEqual(r.capacity, 9);
});
ok('validate tooManySpaced reports spaced capacity', () => {
  const r = S.validateLayout(['a', 'b', 'c', 'd', 'e', 'f'], 3, 3, 'spaced');
  assert.strictEqual(r.error, 'tooManySpaced');
  assert.strictEqual(r.capacity, 5);
});
ok('validate spaced ok at exactly spaced capacity', () => {
  assert.strictEqual(S.validateLayout(['a', 'b', 'c', 'd', 'e'], 3, 3, 'spaced').ok, true);
});

// buildPlan random (seeded)
ok('random plan places every name exactly once, seat numbers sequential', () => {
  const names = ['Rahim', 'Karim', 'Fahad', 'Meem', 'Nusrat'];
  const p = S.buildPlan(names, 2, 3, 'random', S.seededRng(42));
  assert.strictEqual(p.ok, true);
  assert.strictEqual(p.seats.length, 6);
  assert.strictEqual(p.placed, 5);
  assert.strictEqual(p.empty, 1);
  assert.deepStrictEqual(p.seats.map((s) => s.seat), [1, 2, 3, 4, 5, 6]);
  assert.deepStrictEqual(p.seats.map((s) => s.name).filter(Boolean).sort(), names.slice().sort());
});
ok('random plan is deterministic for the same seed', () => {
  const names = ['Rahim', 'Karim', 'Fahad', 'Meem', 'Nusrat'];
  const a = S.buildPlan(names, 2, 3, 'random', S.seededRng(7));
  const b = S.buildPlan(names, 2, 3, 'random', S.seededRng(7));
  assert.deepStrictEqual(a.seats, b.seats);
});

// buildPlan alpha-snake
ok('alpha-snake snakes alternate rows (3x2)', () => {
  const p = S.buildPlan(['F', 'A', 'E', 'B', 'D', 'C'], 3, 2, 'alpha-snake');
  assert.deepStrictEqual(p.seats.map((s) => s.name), ['A', 'B', 'D', 'C', 'E', 'F']);
  assert.deepStrictEqual(p.seats.map((s) => s.seat), [1, 2, 3, 4, 5, 6]);
});

// buildPlan spaced
ok('spaced plan uses checkerboard seats in input order, no orthogonal adjacency', () => {
  const p = S.buildPlan(['A', 'B', 'C', 'D', 'E'], 3, 3, 'spaced');
  assert.strictEqual(p.ok, true);
  assert.deepStrictEqual(
    p.seats.filter((s) => s.name).map((s) => s.seat), [1, 3, 5, 7, 9]);
  assert.deepStrictEqual(
    p.seats.filter((s) => s.name).map((s) => s.name), ['A', 'B', 'C', 'D', 'E']);
  const placed = p.seats.filter((s) => s.name);
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const d = Math.abs(placed[i].row - placed[j].row) + Math.abs(placed[i].col - placed[j].col);
      assert.ok(d > 1, 'adjacent pair: ' + placed[i].seat + ' & ' + placed[j].seat);
    }
  }
});
ok('spaced plan leaves the rest empty', () => {
  const p = S.buildPlan(['A', 'B'], 3, 3, 'spaced');
  assert.strictEqual(p.placed, 2);
  assert.strictEqual(p.empty, 7);
});

// buildPlan errors
ok('buildPlan surfaces tooMany / tooManySpaced / tooFew', () => {
  assert.strictEqual(S.buildPlan(new Array(10).fill('x').map((v, i) => v + i), 3, 3, 'random').error, 'tooMany');
  assert.strictEqual(S.buildPlan(['a', 'b', 'c', 'd', 'e', 'f'], 3, 3, 'spaced').error, 'tooManySpaced');
  assert.strictEqual(S.buildPlan(['a'], 3, 3, 'random').error, 'tooFew');
});

// formatPlanText
ok('formatPlanText renders filled and empty seats', () => {
  const p = S.buildPlan(['Rahim'], 1, 2, 'random'); // 1 row invalid; use 2x2 instead
  const p2 = S.buildPlan(['Rahim', 'Karim'], 2, 2, 'random', S.seededRng(1));
  const text = S.formatPlanText(p2, {});
  assert.ok(text.indexOf('Seat 1 (Row 1, Column 1): ') !== -1);
  assert.ok(text.indexOf('Empty') !== -1);
  assert.ok(text.indexOf('Rahim') !== -1 && text.indexOf('Karim') !== -1);
  assert.strictEqual(p.ok, false); // 1-row layout rejected by design
});
ok('formatPlanText honors Bengali labels', () => {
  const p = S.buildPlan(['Rahim', 'Karim'], 2, 2, 'random', S.seededRng(1));
  const text = S.formatPlanText(p, { seat: 'আসন', row: 'সারি', col: 'কলাম', empty: 'খালি' });
  assert.ok(text.indexOf('আসন 1 (সারি 1, কলাম 1): ') !== -1);
});

// i18n
ok('EN and BN share the same keys', () => {
  assert.deepStrictEqual(Object.keys(STR.bn).sort(), Object.keys(STR.en).sort());
});
ok('Bengali digits convert', () => {
  assert.strictEqual(toBnDigits('2026'), '২০২৬');
  assert.strictEqual(toBnDigits('Seat 12'), 'Seat ১২');
});
ok('BN strings are non-empty and contain Bengali script', () => {
  assert.ok(/[\u0980-\u09FF]/.test(STR.bn.title));
  assert.ok(/[\u0980-\u09FF]/.test(STR.bn.generateBtn));
});

console.log(n + '/' + n + ' unit checks passed');
