// Seating Planner BD — pure seating logic (DOM-free, usable from Node and browser).
// Seat numbering: row-major, front row = row 1. Seat n = (row-1)*cols + col.
(function (root) {
  'use strict';

  // Parse a textarea of names: trim, drop blank lines, dedupe
  // (exact + ASCII case-insensitive), preserve first-seen order.
  function parseNames(text) {
    var out = [];
    var seen = Object.create(null);
    String(text || '').split('\n').forEach(function (line) {
      var name = line.trim();
      if (!name) return;
      var key = name.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      out.push(name);
    });
    return out;
  }

  function isIntInRange(v, lo, hi) {
    return typeof v === 'number' && isFinite(v) && Math.floor(v) === v && v >= lo && v <= hi;
  }

  // Seats used by spaced mode: checkerboard cells where (r + c) is even.
  function countSpacedSeats(rows, cols) {
    return Math.ceil((rows * cols) / 2);
  }

  function validateLayout(names, rows, cols, mode) {
    if (!isIntInRange(rows, 2, 10) || !isIntInRange(cols, 2, 10)) {
      return { ok: false, error: 'badSize' };
    }
    if (!names || names.length < 2) return { ok: false, error: 'tooFew' };
    var capacity = rows * cols;
    if (names.length > capacity) return { ok: false, error: 'tooMany', students: names.length, capacity: capacity };
    if (mode === 'spaced') {
      var spaced = countSpacedSeats(rows, cols);
      if (names.length > spaced) return { ok: false, error: 'tooManySpaced', students: names.length, capacity: spaced };
    }
    return { ok: true, capacity: capacity };
  }

  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Order names for a mode. Random uses rng; alpha-snake sorts then snakes
  // alternate rows; spaced keeps input order (placement handles the gaps).
  function orderNames(names, mode, rng) {
    if (mode === 'alpha-snake') return names.slice().sort(function (a, b) { return a.localeCompare(b); });
    if (mode === 'random') return shuffle(names, rng);
    return names.slice();
  }

  // Build the seat plan. Returns { ok:true, seats, rows, cols, mode, placed, empty }
  // or { ok:false, error, students, capacity }. seats are row-major with
  // { seat, row, col, name } where name is null for an empty seat.
  function buildPlan(names, rows, cols, mode, rng) {
    var check = validateLayout(names, rows, cols, mode);
    if (!check.ok) return check;
    rng = rng || Math.random;
    var ordered = orderNames(names, mode, rng);
    var seats = [];
    var placed = 0;
    var total = rows * cols;
    if (mode === 'spaced') {
      var idx = 0;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var use = ((r + c) % 2 === 0);
          var name = null;
          if (use && idx < ordered.length) { name = ordered[idx++]; placed++; }
          seats.push({ seat: r * cols + c + 1, row: r + 1, col: c + 1, name: name });
        }
      }
    } else if (mode === 'alpha-snake') {
      var k = 0;
      for (var r2 = 0; r2 < rows; r2++) {
        var colsOrder = [];
        for (var c2 = 0; c2 < cols; c2++) colsOrder.push(c2);
        if (r2 % 2 === 1) colsOrder.reverse();
        var rowSeats = [];
        colsOrder.forEach(function (c3) {
          var nm = k < ordered.length ? ordered[k++] : null;
          if (nm) placed++;
          rowSeats.push({ seat: r2 * cols + c3 + 1, row: r2 + 1, col: c3 + 1, name: nm });
        });
        rowSeats.sort(function (a, b) { return a.seat - b.seat; });
        rowSeats.forEach(function (s) { seats.push(s); });
      }
    } else {
      for (var i = 0; i < total; i++) {
        var nm2 = i < ordered.length ? ordered[i] : null;
        if (nm2) placed++;
        seats.push({ seat: i + 1, row: Math.floor(i / cols) + 1, col: (i % cols) + 1, name: nm2 });
      }
    }
    return { ok: true, seats: seats, rows: rows, cols: cols, mode: mode, placed: placed, empty: total - placed };
  }

  // Plain-text rendering of a plan (used by the Copy button).
  function formatPlanText(plan, labels) {
    labels = labels || {};
    var seatWord = labels.seat || 'Seat';
    var rowWord = labels.row || 'Row';
    var colWord = labels.col || 'Column';
    var emptyWord = labels.empty || 'Empty';
    var lines = plan.seats.map(function (s) {
      return seatWord + ' ' + s.seat + ' (' + rowWord + ' ' + s.row + ', ' + colWord + ' ' + s.col + '): ' + (s.name || emptyWord);
    });
    return lines.join('\n');
  }

  // Deterministic RNG for tests (mulberry32).
  function seededRng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var api = {
    parseNames: parseNames,
    countSpacedSeats: countSpacedSeats,
    validateLayout: validateLayout,
    buildPlan: buildPlan,
    formatPlanText: formatPlanText,
    seededRng: seededRng
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Seating = api;
})(typeof window !== 'undefined' ? window : globalThis);
