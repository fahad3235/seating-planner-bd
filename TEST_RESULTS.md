# Seating Planner BD — Test Results (2026-10-29, 12:00 slot)

## Unit tests — 20/20 passed, 0 repairs

`node tests/test.js` — DOM-free `js/seating.js` + `js/i18n.js` tested exactly as shipped:

- `parseNames`: trims, drops blank lines, dedupes case-insensitively
  (`Rahim/Karim/rahim/Fahad` → `Rahim, Karim, Fahad`); empty input → `[]`.
- `countSpacedSeats`: 5×5→13, 4×4→8, 3×3→5, 2×3→3, 2×2→2.
- `validateLayout`: ok for 5 names in 3×3; `badSize` for rows 1, 11, 2.5, NaN;
  `tooFew` for 0/1 names; `tooMany` (10 names, 3×3 → students 10, capacity 9);
  `tooManySpaced` (6 names, 3×3 spaced → capacity 5); spaced ok at exactly 5.
- Random plan (seeded): 5 names in 2×3 → 6 seats, 5 placed, 1 empty, seat
  numbers 1–6, every name exactly once; same seed → identical plan.
- Alpha-snake (3×2): `F,A,E,B,D,C` → seats `A,B,D,C,E,F` (row 2 reversed).
- Spaced plan (3×3, 5 names): names land on seats 1,3,5,7,9 in input order;
  no two placed seats orthogonally adjacent; 2 names in 3×3 → 7 empty.
- `buildPlan` errors surface `tooMany` / `tooManySpaced` / `tooFew`;
  1-row layout rejected (`badSize`) by design.
- `formatPlanText`: `Seat 1 (Row 1, Column 1): …` lines + `Empty` for empty
  seats; Bengali labels render (`আসন 1 (সারি 1, কলাম 1): …`).
- i18n: EN and BN key sets identical; `toBnDigits("2026")` = `২০২৬`;
  BN title and Generate button contain Bengali script.

## Headless-Chrome smoke — 18/18 passed, 0 app repairs (1 harness repair)

`node tests/smoke.js` — raw CDP against the local `file://` page, 0 console/page errors:

- Title `Seating Planner BD`; no-plan message visible on load.
- Demo class loads 24 students; Generate (random, 5×5) renders 25 seats,
  24 filled, 1 empty; seat click shows a detail line with the name.
- Alphabetical snake verified by hand: seat 1 = Arif, seat 10 = Joy,
  seat 6 = Mim, seat 25 = Empty.
- Spaced mode over capacity (24 students, 3×3) shows an inline error;
  empty name list shows an inline error.
- Copy gives feedback (clipboard message or manual-fallback textarea
  containing the plan text).
- বাংলা toggle switches title to Bengali and the students label to
  `শিক্ষার্থীদের নাম`.
- 390 px mobile: no horizontal overflow.

Harness repair: `/opt/meta-chromium/chrome` refuses raw launches in this VM
("Hatch WebGL domain policy is required for browser startup" — the policy
is normally supplied by browser-daemon). The smoke test instead drives the
unpatched Playwright `headless_shell` (chromium_headless_shell-1187), which
serves the same CDP purpose. The app itself needed no repairs.
