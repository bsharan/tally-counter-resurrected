# Spec: UX Redesign + Price-at-Click-Time

## Context
The app's first version (spec 1) works but the main screen is cluttered: it mixes counting,
item editing, and the night check on one page. The steering `product.md` now has a "UX shape"
section (founder decision, 12 Nov 2026) and two new rules (English default, calm uncluttered UX).
This spec implements those decisions and fixes a data-integrity bug in the money model.

## Requirements

### R1 — English default, Telugu toggle
- English is the default language for first-time users.
- A single Telugu/English toggle stays in the header.
- The user's language choice is persisted; returning users keep their preference.

### R2 — Main screen is calm and minimal
- The main screen shows only:
  1. Today's expected cash, large, at the top.
  2. Item tiles, each showing its name, unit price, and running count.
  3. A small Undo button.
  4. A "Close the day" button.
- No item editing, no night check, no clear-day button on the main screen.

### R3 — Night check is a separate view
- "Close the day" opens a separate night-check view.
- That view contains: UPI total input, cash-in-box input, a Check button, the gap verdict,
  and a Back button that returns to the main screen.
- The verdict shows expected vs received and the gap (money missing / sales not clicked / all good).

### R4 — Item editing behind a settings icon
- A gear icon in the header opens a settings view for editing items (add, rename, change price, remove).
- A Back button returns to the main screen.
- The gear replaces the old "Edit items" toggle on the main screen.

### R5 — Calm visual style
- More white space; fewer visible borders; one accent colour.
- Touch targets are at least 56px.
- Readable at 360px viewport width.
- Mobile-first; no layout breakage on small screens.

### R6 — Price-at-click-time (data integrity fix)
- When a click is recorded, the item's price at that moment is stored in the click record.
- Expected cash sums the stored prices from the click log — not the current item price.
- Editing an item's price later does NOT change the value of earlier sales.
- Removing an item does NOT delete or devalue its past clicks (they keep their stored price and
  still count toward expected cash).
- Renaming an item updates the name on existing clicks so counts follow, but stored prices stay
  frozen at the price when the click happened.

### R7 — Tests
- All existing tests must still pass.
- New tests for: price edited mid-day, item removed after clicks, item renamed after clicks.

## Out of scope (spec 2)
- AI summary, Bedrock backend, voice input, ESP32 hardware.
