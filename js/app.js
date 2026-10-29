// Seating Planner BD — DOM wiring. Depends on Seating (js/seating.js) and I18n (js/i18n.js).
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var STR = window.I18n.STR;
  var toBn = window.I18n.toBnDigits;
  var LS_LANG = 'seating-planner-bd-lang';
  var LS_DATA = 'seating-planner-bd-v1';

  var DEMO_NAMES = ['Rahim', 'Karim', 'Fahad', 'Meem', 'Shihab', 'Muhsinul', 'Riyad',
    'Joy', 'Rifat', 'Siniya', 'Nusrat', 'Tanvir', 'Sumaiya', 'Arif', 'Priya',
    'Hridoy', 'Mim', 'Sakib', 'Farhana', 'Nabil', 'Tasnim', 'Rakib', 'Lamia', 'Imran'];

  var lang = localStorage.getItem(LS_LANG) || 'en';
  var plan = null;

  function t(key) { return STR[lang][key]; }
  function digits(s) { return lang === 'bn' ? toBn(s) : String(s); }
  function fill(template, vars) {
    return template.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
  }

  function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.title = t('title');
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
    $('langBtn').textContent = t('langBtn');
    updateCount();
    updateCapacityHint();
    renderPlan();
  }

  function currentNames() { return window.Seating.parseNames($('namesInput').value); }
  function currentSize() {
    return { rows: parseInt($('rowsInput').value, 10), cols: parseInt($('colsInput').value, 10) };
  }
  function currentMode() {
    var r = document.querySelector('input[name="mode"]:checked');
    return r ? r.value : 'random';
  }

  function updateCount() {
    $('namesCount').textContent = fill(t('studentsCount'), { n: digits(currentNames().length) });
  }
  function updateCapacityHint() {
    var size = currentSize();
    var mode = currentMode();
    if (mode === 'spaced' && size.rows >= 2 && size.rows <= 10 && size.cols >= 2 && size.cols <= 10) {
      $('capacityHint').textContent = fill(t('spacedHint'), { n: digits(window.Seating.countSpacedSeats(size.rows, size.cols)) });
    } else if (size.rows >= 2 && size.rows <= 10 && size.cols >= 2 && size.cols <= 10) {
      $('capacityHint').textContent = fill(t('capacityHint'), { n: digits(size.rows * size.cols) });
    } else {
      $('capacityHint').textContent = '';
    }
  }

  function showError(result) {
    var msg = '';
    if (result.error === 'tooFew') msg = t('errTooFew');
    else if (result.error === 'errBadSize' || result.error === 'badSize') msg = t('errBadSize');
    else if (result.error === 'tooMany') msg = fill(t('errTooMany'), { s: digits(result.students), c: digits(result.capacity) });
    else if (result.error === 'tooManySpaced') msg = fill(t('errTooManySpaced'), { s: digits(result.students), c: digits(result.capacity) });
    $('errorBox').textContent = msg;
    $('errorBox').style.display = msg ? 'block' : 'none';
  }

  function renderPlan() {
    var grid = $('planGrid');
    grid.innerHTML = '';
    $('copyFallback').style.display = 'none';
    $('copyMsg').textContent = '';
    if (!plan) {
      $('noPlanMsg').style.display = 'block';
      $('frontLabel').style.display = 'none';
      $('seatDetail').textContent = '';
      $('planActions').style.display = 'none';
      return;
    }
    $('noPlanMsg').style.display = 'none';
    $('frontLabel').style.display = 'block';
    $('frontLabel').textContent = t('frontLabel');
    $('planActions').style.display = 'flex';
    grid.style.gridTemplateColumns = 'repeat(' + plan.cols + ', 1fr)';
    plan.seats.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'seat' + (s.name ? ' filled' : ' empty');
      b.setAttribute('data-seat', s.seat);
      var num = document.createElement('span');
      num.className = 'seat-num';
      num.textContent = digits(s.seat);
      var nm = document.createElement('span');
      nm.className = 'seat-name';
      nm.textContent = s.name || t('emptyWord');
      b.appendChild(num);
      b.appendChild(nm);
      b.addEventListener('click', function () {
        grid.querySelectorAll('.seat.selected').forEach(function (el) { el.classList.remove('selected'); });
        b.classList.add('selected');
        $('seatDetail').textContent = s.name
          ? fill(t('seatDetail') || '', { seat: digits(s.seat), row: digits(s.row), col: digits(s.col), name: s.name })
          : fill(t('seatDetail') || '', { seat: digits(s.seat), row: digits(s.row), col: digits(s.col), name: t('emptyWord') });
      });
      grid.appendChild(b);
    });
    $('seatDetail').textContent = t('seatDetailHint');
  }

  function save() {
    try {
      localStorage.setItem(LS_DATA, JSON.stringify({
        text: $('namesInput').value,
        rows: $('rowsInput').value,
        cols: $('colsInput').value,
        mode: currentMode(),
        plan: plan
      }));
    } catch (e) { /* storage full/blocked: app still works for the session */ }
  }

  function generate() {
    var size = currentSize();
    var result = window.Seating.buildPlan(currentNames(), size.rows, size.cols, currentMode());
    if (!result.ok) { showError(result); return; }
    showError({ error: null });
    plan = result;
    save();
    renderPlan();
  }

  function copyPlan() {
    if (!plan) return;
    var text = window.Seating.formatPlanText(plan, {
      seat: t('seatWord'), row: t('rowWord'), col: t('colWord'), empty: t('emptyWord')
    });
    var done = function () { $('copyMsg').textContent = t('copiedMsg'); $('copyFallback').style.display = 'none'; };
    var fallback = function () {
      $('copyFallback').value = text;
      $('copyFallback').style.display = 'block';
      $('copyMsg').textContent = t('copyReadyMsg');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  // Events
  $('namesInput').addEventListener('input', function () { updateCount(); save(); });
  $('rowsInput').addEventListener('input', function () { updateCapacityHint(); save(); });
  $('colsInput').addEventListener('input', function () { updateCapacityHint(); save(); });
  document.querySelectorAll('input[name="mode"]').forEach(function (r) {
    r.addEventListener('change', function () { updateCapacityHint(); save(); });
  });
  $('demoBtn').addEventListener('click', function () {
    $('namesInput').value = DEMO_NAMES.join('\n');
    updateCount(); save();
  });
  $('clearNamesBtn').addEventListener('click', function () {
    $('namesInput').value = '';
    updateCount(); save();
  });
  $('generateBtn').addEventListener('click', generate);
  $('regenerateBtn').addEventListener('click', generate);
  $('clearPlanBtn').addEventListener('click', function () {
    plan = null; save(); renderPlan();
  });
  $('copyBtn').addEventListener('click', copyPlan);
  $('langBtn').addEventListener('click', function () {
    lang = lang === 'en' ? 'bn' : 'en';
    try { localStorage.setItem(LS_LANG, lang); } catch (e) { /* ignore */ }
    applyLang();
  });

  // Restore saved session
  try {
    var saved = JSON.parse(localStorage.getItem(LS_DATA) || 'null');
    if (saved) {
      $('namesInput').value = saved.text || '';
      $('rowsInput').value = saved.rows || 5;
      $('colsInput').value = saved.cols || 5;
      var modeRadio = document.querySelector('input[name="mode"][value="' + (saved.mode || 'random') + '"]');
      if (modeRadio) modeRadio.checked = true;
      if (saved.plan && saved.plan.ok !== false) plan = saved.plan;
    }
  } catch (e) { /* corrupt storage: start fresh */ }

  applyLang();
})();
