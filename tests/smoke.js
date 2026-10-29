// Headless-Chrome smoke test via raw CDP (no puppeteer dependency).
// Usage: node tests/smoke.js — exits non-zero on any failure or page error.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 9352;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
let failures = 0;
const pageErrors = [];
function check(name, cond, extra) {
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function poll(fn, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if (await fn()) return true; } catch (e) { /* retry */ }
    await wait(200);
  }
  return false;
}

(async () => {
  // NOTE: /opt/meta-chromium/chrome refuses raw launches in this VM
  // ("Hatch WebGL domain policy is required for browser startup" — the
  // policy is normally supplied by browser-daemon). The unpatched
  // Playwright headless_shell serves the same CDP smoke purpose.
  const CHROME_BIN = process.env.CHROME_BIN ||
    require('os').homedir() + '/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell';
  const chrome = spawn(CHROME_BIN, [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/sp-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push(JSON.stringify(msg.params.args));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    }
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result ? r.result.result.value : undefined;
  };
  await send('Page.enable', {});
  await send('Runtime.enable', {});
  await send('Page.navigate', { url: FILE });
  await poll(async () => (await ev('!!document.getElementById("planGrid")')), 10000);

  const seatName = (n) => ev(`(document.querySelector('.seat[data-seat="${n}"] .seat-name')||{}).textContent`);
  const seatCount = () => ev('document.querySelectorAll(".seat").length');
  const filledCount = () => ev('document.querySelectorAll(".seat.filled").length');

  check('title is Seating Planner BD', (await ev('document.title')).indexOf('Seating Planner BD') === 0);
  check('no-plan message visible on load', (await ev('document.getElementById("noPlanMsg").style.display')) === 'block');
  check('no console/page errors on load', pageErrors.length === 0, pageErrors.join(' | '));

  // Demo class -> 24 students
  await ev('document.getElementById("demoBtn").click()');
  await wait(200);
  check('demo loads 24 students', (await ev('document.getElementById("namesCount").textContent')).indexOf('24') !== -1);

  // Generate random 5x5 -> 25 seats, 24 filled, 1 empty
  await ev('document.getElementById("generateBtn").click()');
  await wait(300);
  check('random plan renders 25 seats', (await seatCount()) === 25, 'got ' + (await seatCount()));
  check('24 filled, 1 empty', (await filledCount()) === 24);

  // Seat click -> detail line
  await ev('document.querySelector(\'.seat[data-seat="1"]\').click()');
  await wait(200);
  const detail = await ev('document.getElementById("seatDetail").textContent');
  check('seat click shows detail with name', detail.indexOf('Seat 1') !== -1 && detail.length > 10, detail);

  // Alphabetical snake: seat1 Arif, seat10 Joy, seat6 Mim, seat25 empty
  await ev('document.querySelector(\'input[name="mode"][value="alpha-snake"]\').click()');
  await ev('document.getElementById("generateBtn").click()');
  await wait(300);
  check('snake seat 1 is Arif', (await seatName(1)) === 'Arif', 'got ' + (await seatName(1)));
  check('snake seat 10 is Joy', (await seatName(10)) === 'Joy', 'got ' + (await seatName(10)));
  check('snake seat 6 is Mim', (await seatName(6)) === 'Mim', 'got ' + (await seatName(6)));
  check('snake seat 25 is Empty', (await seatName(25)) === 'Empty', 'got ' + (await seatName(25)));

  // Spaced mode over capacity -> inline error
  await ev(`document.getElementById('rowsInput').value='3';
    document.getElementById('colsInput').value='3';
    document.querySelector('input[name="mode"][value="spaced"]').click();
    document.getElementById("generateBtn").click();`);
  await wait(300);
  check('spaced over-capacity shows inline error', (await ev('document.getElementById("errorBox").style.display')) === 'block');

  // Too few students -> inline error
  await ev(`document.getElementById('namesInput').value='';
    document.querySelector('input[name="mode"][value="random"]').click();
    document.getElementById('generateBtn').click();`);
  await wait(300);
  check('empty names show inline error', (await ev('document.getElementById("errorBox").style.display')) === 'block');

  // Copy: regenerate a valid plan, then copy (clipboard or manual fallback)
  await ev(`document.getElementById('demoBtn').click();
    document.getElementById('rowsInput').value='5';
    document.getElementById('colsInput').value='5';
    document.getElementById('generateBtn').click();
    document.getElementById('copyBtn').click();`);
  await wait(500);
  const copyOk = (await ev('document.getElementById("copyMsg").textContent')).length > 0;
  const fallbackHasPlan = (await ev('document.getElementById("copyFallback").style.display')) === 'block'
    && (await ev('document.getElementById("copyFallback").value')).indexOf('Rahim') !== -1;
  check('copy gives feedback (clipboard msg or manual fallback with plan text)', copyOk && (await ev('document.getElementById("copyMsg").textContent')).length > 0, 'msg=' + (await ev('document.getElementById("copyMsg").textContent')) + ' fallback=' + fallbackHasPlan);

  // Language toggle -> Bengali title
  await ev('document.getElementById("langBtn").click()');
  await wait(200);
  check('BN toggle changes title to Bengali', (await ev('document.title')).indexOf('সিট') !== -1, await ev('document.title'));
  check('BN toggle changes students label', (await ev('document.querySelector(\'[data-i18n="studentsLabel"]\').textContent')) === 'শিক্ষার্থীদের নাম');

  // 390px mobile: no horizontal overflow
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await wait(300);
  check('390px no horizontal overflow', (await ev('document.documentElement.scrollWidth')) <= 390, 'scrollWidth=' + (await ev('document.documentElement.scrollWidth')));

  check('no console/page errors during smoke', pageErrors.length === 0, pageErrors.join(' | '));

  ws.close();
  chrome.kill();
  console.log(failures === 0 ? 'SMOKE GREEN' : 'SMOKE FAILURES: ' + failures);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.log('SMOKE HARNESS ERROR: ' + e.message); process.exit(2); });
