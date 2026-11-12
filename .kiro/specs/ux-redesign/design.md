# Design: UX Redesign + Price-at-Click-Time

## D1 — Data model change

### Click record
Before: `{ name, ts }`
After:  `{ name, price, ts }` — `price` is the item's price at the moment of the click.

### `addClick(saleLog, itemName, items, ts)`
Now looks up the item, copies its `price` into the click record, then appends.
Still throws on unknown items (rule 3 never breaks).

### `expectedCash(saleLog, items)`
Now iterates the click log and sums each click's stored `price`.
**Backward compatibility**: a click with no `price` field (old localStorage data, or hand-built
in tests) falls back to looking up the item by name in `items`. This keeps all existing tests
passing and migrates old stored data transparently.

### `removeItem(items, index)` and `renameItem(items, saleLog, oldName, newName)`
Two new helpers so app.js doesn't inline this logic:
- `removeItem`: splices the item from `items`. Clicks are untouched — they keep their stored
  price and still sum into expected cash. If items becomes empty, reset to defaults.
- `renameItem`: updates the name in `items` and rewrites the `name` on matching clicks so the
  count badge follows. Stored prices are never touched.

## D2 — View architecture

Three views in one page, shown/hidden via a `hidden` attribute on a wrapper `<div>`:

```
#view-main        expected cash, item grid, undo, close-the-day
#view-nightcheck  UPI, cash, check, verdict, back
#view-settings    item edit list, add-item form, back
```

A single `showView(name)` function toggles `hidden` on all three wrappers.
The header (title + gear + lang toggle) stays visible across all views.
Night-check and settings each have their own Back button that calls `showView('main')`.

## D3 — Header layout

```
[ title ]                        [ ⚙ gear ]  [ EN/తె ]
```
- Gear icon opens the settings view.
- Lang toggle switches `state.lang` and persists.
- Both are always visible.

## D4 — CSS / visual style

- Accent colour: `#7a2e1e` (terracotta) — the single accent. Used for expected-cash number,
  primary buttons, and active states only.
- Backgrounds: warm off-white `#f7f3ee`; cards have no border, just a slightly lighter surface
  and spacing. Borders removed in favour of whitespace separation.
- Touch targets: item tiles and all buttons ≥ 56px min-height.
- Expected cash: large (≈ 2.5rem), centred or left-aligned prominently at top.
- Item grid: 2 columns, generous gap, tiles with just name + price + count badge.
- Undo: small text button, secondary styling.
- "Close the day": full-width primary button below the grid.
- Readable at 360px: font sizes scale down slightly, grid stays 2-col.

## D5 — i18n changes

- Default language changes from `'te'` to `'en'`.
- New keys: `close_the_day`, `settings`, `back`.
- All existing keys retained; Telugu translations kept.

## D6 — app.js changes

- `loadState`: default `K_LANG` fallback to `'en'`.
- `showView(name)`: toggles the three view wrappers.
- `onItemClick`: unchanged call to `addClick` (now stores price internally).
- Rename handler in edit list: uses new `renameItem` helper or inlines the name rewrite on
  clicks. Price inputs edit `items` only — never touch click records.
- Remove handler: uses `removeItem` helper. Clicks stay.
- `onCheck`: unchanged logic (gapVerdict), but verdict rendered in the night-check view.
- Gear button → `showView('settings')`.
- "Close the day" button → `showView('nightcheck')`.
- Back buttons → `showView('main')`.
- Removed from main: edit toggle, edit panel, clear-day button. (Day still auto-resets on
  rollover via `todayKey`.)

## D7 — Files touched

| File | Change |
|------|--------|
| `src/logic.js` | addClick stores price; expectedCash sums stored prices w/ fallback; add removeItem, renameItem |
| `src/i18n.js` | default 'en'; new keys close_the_day, settings, back |
| `index.html` | 3-view structure; calm CSS; gear icon; close-the-day; back buttons |
| `src/app.js` | showView; English default; gear/close handlers; rename/remove use new logic; no edit panel on main |
| `tests/logic.test.js` | update 2 deepEqual tests; add price-snapshot, remove-after-clicks, rename-after-clicks tests |
| `sw.js` | no new files to cache (same shell) |

## D8 — Backward compatibility

- Old click records in localStorage (no `price` field) are handled by the expectedCash fallback.
- Day-rollover logic (`todayKey`) is unchanged.
- All other storage keys are unchanged.
