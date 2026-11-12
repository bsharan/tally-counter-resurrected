// src/logic.js
// Pure money & counting logic for Tally Counter, Resurrected.
// No DOM, no storage, no network — deterministic and unit-tested.
// Usable in the browser (window.TallyLogic) and in Node tests (module.exports).

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TallyLogic = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Default shop items (₹ prices). Matches the spec kickoff.
  function defaultItems() {
    return [
      { name: 'Tea', price: 12 },
      { name: 'Coffee', price: 15 },
      { name: 'Samosa', price: 10 },
      { name: 'Biscuit', price: 5 },
    ];
  }

  // Normalize + validate a single item definition. Returns null if invalid.
  // A valid item has a non-empty name and a finite, non-negative price.
  function validateItem(item) {
    if (!item || typeof item !== 'object') return null;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name) return null;
    const price = Number(item.price);
    if (!Number.isFinite(price) || price < 0) return null;
    return { name: name, price: price };
  }

  // Validate a full items list, dropping any invalid or duplicate entries.
  function validateItems(items) {
    if (!Array.isArray(items)) return [];
    const seen = new Set();
    const out = [];
    for (const it of items) {
      const v = validateItem(it);
      if (!v) continue;
      if (seen.has(v.name)) continue;
      seen.add(v.name);
      out.push(v);
    }
    return out;
  }

  // Add a single click for itemName to the sale log.
  // The item's price at this moment is stored in the click record, so a later
  // price edit never changes the value of earlier sales.
  // Returns a NEW log (immutable). Throws if itemName is not in items.
  function addClick(saleLog, itemName, items, ts) {
    if (!Array.isArray(saleLog)) saleLog = [];
    if (typeof ts !== 'number' || !Number.isFinite(ts)) ts = Date.now();
    const found = items.find(function (i) { return i.name === itemName; });
    if (!found) {
      throw new Error('Unknown item: ' + itemName);
    }
    return saleLog.concat([{ name: itemName, price: found.price, ts: ts }]);
  }

  // Undo the last click. An empty log stays empty. Returns a NEW log.
  function undoLast(saleLog) {
    if (!Array.isArray(saleLog) || saleLog.length === 0) return [];
    return saleLog.slice(0, -1);
  }

  // Clear all sales. Returns an empty array.
  function clearLog() {
    return [];
  }

  // Count clicks per item from the log. Returns { name: count }.
  function countsFromLog(saleLog) {
    const counts = Object.create(null);
    if (!Array.isArray(saleLog)) return counts;
    for (let i = 0; i < saleLog.length; i++) {
      const n = saleLog[i].name;
      counts[n] = (counts[n] || 0) + 1;
    }
    return counts;
  }

  // Expected cash = sum of each click's stored price.
  // Clicks created by addClick carry their own price (the price at click time),
  // so editing an item's price later never changes earlier sales.
  // For backward compat (old data / test clicks without a price field),
  // fall back to looking up the item's current price by name.
  function expectedCash(saleLog, items) {
    if (!Array.isArray(saleLog)) return 0;
    let total = 0;
    for (let i = 0; i < saleLog.length; i++) {
      const click = saleLog[i];
      if (typeof click.price === 'number' && Number.isFinite(click.price)) {
        total += click.price;
      } else {
        const item = items.find(function (it) { return it.name === click.name; });
        total += item ? item.price : 0;
      }
    }
    return total;
  }

  // Coerce a user-entered money value to a number. Returns 0 for
  // empty / non-finite / negative input so arithmetic never breaks.
  function toNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  // Gap verdict: compares expected cash against received (upi + cash).
  //   gap < 0  → 'short'  (money missing / under-counted)
  //   gap > 0  → 'over'   (received more than tracked — sales not clicked)
  //   gap = 0  → 'ok'     (all good)
  function gapVerdict(saleLog, items, upiTotal, cashTotal) {
    const expected = expectedCash(saleLog, items);
    const upi = toNumber(upiTotal);
    const cash = toNumber(cashTotal);
    const received = upi + cash;
    const gap = received - expected;
    let status;
    if (gap < 0) status = 'short';
    else if (gap > 0) status = 'over';
    else status = 'ok';
    return {
      expected: expected,
      received: received,
      upi: upi,
      cash: cash,
      gap: gap,
      status: status,
    };
  }

  // Total number of clicks in the log.
  function totalClicks(saleLog) {
    return Array.isArray(saleLog) ? saleLog.length : 0;
  }

  // Remove an item at index. Clicks are NOT touched — past sales keep their
  // stored price and still count toward expected cash. If items becomes
  // empty, reset to defaults so the shop always has something to click.
  // Returns a NEW items array.
  function removeItem(items, index) {
    if (!Array.isArray(items) || index < 0 || index >= items.length) {
      return Array.isArray(items) ? items.slice() : defaultItems();
    }
    var next = items.slice();
    next.splice(index, 1);
    return next.length === 0 ? defaultItems() : next;
  }

  // Rename an item from oldName to newName. Updates the name in the items list
  // AND rewrites the name on matching clicks so the count badge follows.
  // Stored prices on those clicks are never touched. If newName is invalid or
  // already exists, returns the inputs unchanged.
  // Returns { items, saleLog } — both NEW arrays.
  function renameItem(items, saleLog, oldName, newName) {
    var v = validateItem({ name: newName, price: 0 });
    if (!v) return { items: items, saleLog: saleLog };
    var cleanName = v.name;
    // reject if the new name already exists (on a different item)
    var clash = items.some(function (it) { return it.name === cleanName && it.name !== oldName; });
    if (clash) return { items: items, saleLog: saleLog };
    var newItems = items.map(function (it) {
      return it.name === oldName ? { name: cleanName, price: it.price } : it;
    });
    var newLog = saleLog.map(function (c) {
      return c.name === oldName ? { name: cleanName, price: c.price, ts: c.ts } : c;
    });
    return { items: newItems, saleLog: newLog };
  }

  // Returns today's date as a 'YYYY-MM-DD' string, for day-rollover detection.
  function todayKey(now) {
    const d = now ? new Date(now) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  return {
    defaultItems: defaultItems,
    validateItem: validateItem,
    validateItems: validateItems,
    addClick: addClick,
    undoLast: undoLast,
    clearLog: clearLog,
    removeItem: removeItem,
    renameItem: renameItem,
    countsFromLog: countsFromLog,
    expectedCash: expectedCash,
    toNumber: toNumber,
    gapVerdict: gapVerdict,
    totalClicks: totalClicks,
    todayKey: todayKey,
  };
}));
