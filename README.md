# Seating Planner BD

Offline bilingual (English / বাংলা) classroom and exam-hall seating planner.
Type or paste a class list, choose the hall size, pick an arrangement, and get
a seat-by-seat plan in seconds. Everything runs in the browser — no account,
no server, no network requests.

## Features

1. **Student list input** — one name per line, paste-friendly; trims blanks and
   removes duplicate names automatically, with a live student count.
2. **Hall layout** — rows × columns from 2 to 10, with a live seat-capacity
   hint and a "Board / Teacher" front-of-room marker on the plan.
3. **Three arrangements**
   - *Random shuffle* — Fisher–Yates shuffle of the class list.
   - *Alphabetical (snake rows)* — names sorted A→Z, snaking left-to-right
     then right-to-left so neighbours stay alphabetical neighbours.
   - *Spaced out (exam mode)* — checkerboard placement, so no two students
     sit orthogonally adjacent; refuses with a clear message when the hall
     cannot fit the class this way.
4. **Seat grid + details** — tap any seat to see its seat number, row,
   column, and student; empty seats are shown as Empty.
5. **Copy plan as text** — one click copies a plain-text seat list
   (clipboard API, with a manual-copy fallback textarea when clipboard
   access is unavailable).
6. **Demo class + persistence** — a 24-student demo class loader; names,
   layout, mode, and the last plan persist in `localStorage` so a plan
   survives a page reload.
7. **Bilingual UI** — English / বাংলা toggle (persisted), with Bengali
   digits in counts and seat numbers when বাংলা is active. Fully
   responsive down to 390 px wide.

## Stack

Pure static HTML + CSS + vanilla JavaScript. No build step, no dependencies,
no backend. The seating logic (`js/seating.js`) is DOM-free and is tested
directly in Node; `js/i18n.js` holds the English/Bangla strings.

## Run locally

```bash
# Any static server, or just open the file:
open index.html
# e.g. python3 -m http.server 8000  # then http://localhost:8000/
```

## Testing

```bash
node tests/test.js    # unit tests for the seating logic + i18n
node tests/smoke.js   # headless-Chrome (CDP) UI smoke tests
```

The smoke test drives the Playwright `headless_shell` (CDP) against the
local `file://` page. (The Hatch-patched `/opt/meta-chromium/chrome`
refuses raw launches in this VM — it requires a WebGL domain policy that
only browser-daemon supplies — so the unpatched headless shell is used
for local QA instead.)

## Project layout

```
index.html          Page shell
css/style.css       Styles (responsive, 390 px mobile)
js/seating.js       Pure seating logic (parse, validate, build, format)
js/i18n.js          EN / বাংলা strings + Bengali-digit helper
js/app.js           DOM wiring, persistence, copy, language toggle
tests/test.js       Node unit tests
tests/smoke.js      Headless-Chrome UI smoke tests
```

## Limitations

- Plans are stored only in the current browser's `localStorage`; clearing
  site data removes them.
- The alphabetical order uses the browser's default string comparison, so
  Bangla-script sort order follows the platform locale.
- Spaced (exam) mode is a checkerboard layout aid, not a substitute for a
  school's official seating rules — invigilators should verify the plan.
- The copy button needs clipboard permission in some browsers; when it is
  denied, the plan text is shown in a box for manual copying.

## Status

MVP complete. See `TEST_RESULTS.md` for the measured test results.
