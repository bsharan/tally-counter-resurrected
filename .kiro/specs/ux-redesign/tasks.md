# Tasks: UX Redesign + Price-at-Click-Time

> Checked items are done. `[N]` marks task order.

- [1] **Update src/logic.js**
  - [1a] `addClick`: store `found.price` in the click record → `{ name, price, ts }`
  - [1b] `expectedCash`: iterate saleLog, sum `click.price`; fallback to items lookup when price
    field is missing (backward compat for old data / manual test clicks)
  - [1c] Add `removeItem(items, index)` — splices item; returns new array; resets to defaults if empty
  - [1d] Add `renameItem(items, saleLog, oldName, newName)` — renames in items + rewrites click names

- [2] **Update tests/logic.test.js**
  - [2a] Fix "appends one click for a known item" deepEqual — expect price field
  - [2b] Fix "handles non-array log defensively" deepEqual — expect price field
  - [2c] Add test: price edited mid-day — click at price A, change item price to B, expected cash still = A
  - [2d] Add test: item removed after clicks — clicks retain value, expected cash still counts them
  - [2e] Add test: item renamed after clicks — counts follow new name, stored prices unchanged
  - [2f] Add tests for removeItem and renameItem helpers

- [3] **Run tests** — `node --test` — all existing + new pass

- [4] **Update src/i18n.js**
  - [4a] Change default to 'en'
  - [4b] Add keys: close_the_day, settings, back (both en + te)

- [5] **Redesign index.html**
  - [5a] Header: title + gear icon (#gearBtn) + lang toggle
  - [5b] #view-main: expected cash (large), item grid, undo, close-the-day button
  - [5c] #view-nightcheck: UPI, cash, check, verdict, back button
  - [5d] #view-settings: edit list, add-item form, back button
  - [5e] CSS: calm style — 56px targets, fewer borders, whitespace, one accent, 360px readable

- [6] **Rewrite src/app.js**
  - [6a] showView(name) toggling three wrappers
  - [6b] Default lang 'en'
  - [6c] Gear → showView('settings'); close-the-day → showView('nightcheck'); backs → showView('main')
  - [6d] Remove edit toggle / edit panel / clear-day from main
  - [6e] Rename handler uses renameItem (rewrites click names, keeps stored prices)
  - [6f] Remove handler uses removeItem (clicks untouched)
  - [6g] Render works per-view (item grid on main, edit list on settings, verdict on nightcheck)

- [7] **Check sw.js** — confirm cache list still covers the app shell (no new files)

- [8] **Final verification**
  - [8a] `node --test` — all pass
  - [8b] `node --check` on all JS files
  - [8c] Cross-check element IDs between app.js and index.html
  - [8d] Review structure vs steering
