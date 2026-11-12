// tests/logic.test.js
// Unit tests for all money & counting logic. Run with:  node --test
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/logic.js');

describe('defaultItems', () => {
  test('returns the four spec defaults with correct prices', () => {
    const items = L.defaultItems();
    assert.deepEqual(items, [
      { name: 'Tea', price: 12 },
      { name: 'Coffee', price: 15 },
      { name: 'Samosa', price: 10 },
      { name: 'Biscuit', price: 5 },
    ]);
  });

  test('returns a fresh array each call (no shared mutation)', () => {
    const a = L.defaultItems();
    const b = L.defaultItems();
    assert.notEqual(a, b);
    a[0].price = 999;
    assert.equal(b[0].price, 12);
  });
});

describe('validateItem', () => {
  test('trims name and coerces numeric price', () => {
    assert.deepEqual(L.validateItem({ name: ' Tea ', price: '12' }), { name: 'Tea', price: 12 });
  });

  test('accepts zero price', () => {
    assert.deepEqual(L.validateItem({ name: 'Free', price: 0 }), { name: 'Free', price: 0 });
  });

  test('rejects empty / whitespace name', () => {
    assert.equal(L.validateItem({ name: '   ', price: 10 }), null);
    assert.equal(L.validateItem({ name: '', price: 10 }), null);
  });

  test('rejects non-finite or negative price', () => {
    assert.equal(L.validateItem({ name: 'X', price: -1 }), null);
    assert.equal(L.validateItem({ name: 'X', price: NaN }), null);
    assert.equal(L.validateItem({ name: 'X', price: 'abc' }), null);
  });

  test('rejects null / undefined / non-object', () => {
    assert.equal(L.validateItem(null), null);
    assert.equal(L.validateItem(undefined), null);
    assert.equal(L.validateItem('Tea'), null);
  });
});

describe('validateItems', () => {
  test('drops invalid entries and keeps valid ones', () => {
    const out = L.validateItems([
      { name: 'Tea', price: 12 },
      { name: '', price: 5 },      // invalid name
      { name: 'Coffee', price: 15 },
      { name: 'X', price: -3 },    // invalid price
    ]);
    assert.deepEqual(out, [
      { name: 'Tea', price: 12 },
      { name: 'Coffee', price: 15 },
    ]);
  });

  test('skips duplicate names (first wins)', () => {
    const out = L.validateItems([
      { name: 'Tea', price: 12 },
      { name: 'Tea', price: 20 },
    ]);
    assert.deepEqual(out, [{ name: 'Tea', price: 12 }]);
  });

  test('returns [] for non-array input', () => {
    assert.deepEqual(L.validateItems(null), []);
    assert.deepEqual(L.validateItems('nope'), []);
  });
});

describe('addClick', () => {
  const items = L.defaultItems();

  test('appends one click for a known item', () => {
    const log = L.addClick([], 'Tea', items, 1000);
    assert.deepEqual(log, [{ name: 'Tea', price: 12, ts: 1000 }]);
  });

  test('stores the item price at click time', () => {
    const log = L.addClick([], 'Coffee', items, 1);
    assert.equal(log[0].price, 15);
  });

  test('is immutable — original log unchanged', () => {
    const orig = [];
    L.addClick(orig, 'Tea', items, 1);
    assert.equal(orig.length, 0);
  });

  test('stacks multiple clicks', () => {
    let log = [];
    log = L.addClick(log, 'Tea', items, 1);
    log = L.addClick(log, 'Tea', items, 2);
    log = L.addClick(log, 'Samosa', items, 3);
    assert.equal(log.length, 3);
    assert.equal(log[2].name, 'Samosa');
  });

  test('throws on unknown item (never corrupts counts)', () => {
    assert.throws(() => L.addClick([], 'Pizza', items), /Unknown item/);
  });

  test('defaults ts to Date.now when omitted', () => {
    const before = Date.now();
    const log = L.addClick([], 'Tea', items);
    const after = Date.now();
    assert.ok(log[0].ts >= before && log[0].ts <= after);
  });

  test('handles non-array log defensively', () => {
    const log = L.addClick(null, 'Tea', items, 5);
    assert.deepEqual(log, [{ name: 'Tea', price: 12, ts: 5 }]);
  });
});

describe('undoLast', () => {
  test('removes the last click', () => {
    const log = [{ name: 'Tea', ts: 1 }, { name: 'Coffee', ts: 2 }];
    assert.deepEqual(L.undoLast(log), [{ name: 'Tea', ts: 1 }]);
  });

  test('empty log stays empty', () => {
    assert.deepEqual(L.undoLast([]), []);
  });

  test('is immutable — original unchanged', () => {
    const log = [{ name: 'Tea', ts: 1 }];
    L.undoLast(log);
    assert.equal(log.length, 1);
  });

  test('handles non-array defensively', () => {
    assert.deepEqual(L.undoLast(null), []);
  });

  test('undo then redo yields same length', () => {
    let log = [];
    log = L.addClick(log, 'Tea', L.defaultItems(), 1);
    log = L.addClick(log, 'Tea', L.defaultItems(), 2);
    log = L.undoLast(log);
    assert.equal(log.length, 1);
    log = L.addClick(log, 'Tea', L.defaultItems(), 3);
    assert.equal(log.length, 2);
  });
});

describe('clearLog', () => {
  test('returns an empty array', () => {
    assert.deepEqual(L.clearLog(), []);
  });
});

describe('countsFromLog', () => {
  test('tallies counts per item name', () => {
    const log = [
      { name: 'Tea', ts: 1 },
      { name: 'Tea', ts: 2 },
      { name: 'Coffee', ts: 3 },
    ];
    // countsFromLog uses Object.create(null) to guard against prototype
    // pollution from item names like "__proto__", so we compare per-key.
    const counts = L.countsFromLog(log);
    assert.equal(counts.Tea, 2);
    assert.equal(counts.Coffee, 1);
    assert.equal(Object.keys(counts).length, 2);
  });

  test('empty log yields empty object', () => {
    const counts = L.countsFromLog([]);
    assert.equal(Object.keys(counts).length, 0);
  });

  test('no inherited prototype keys (Object.create(null))', () => {
    const counts = L.countsFromLog([]);
    assert.ok(!Object.prototype.hasOwnProperty.call(counts, 'toString'));
  });
});

describe('expectedCash', () => {
  const items = L.defaultItems();

  test('zero sales → zero cash', () => {
    assert.equal(L.expectedCash([], items), 0);
  });

  test('single item: 3 teas × 12 = 36', () => {
    let log = [];
    log = L.addClick(log, 'Tea', items, 1);
    log = L.addClick(log, 'Tea', items, 2);
    log = L.addClick(log, 'Tea', items, 3);
    assert.equal(L.expectedCash(log, items), 36);
  });

  test('mixed items: 2 tea + 1 coffee + 1 samosa + 3 biscuit', () => {
    // 2×12 + 1×15 + 1×10 + 3×5 = 24+15+10+15 = 64
    let log = [];
    log = L.addClick(log, 'Tea', items, 1);
    log = L.addClick(log, 'Tea', items, 2);
    log = L.addClick(log, 'Coffee', items, 3);
    log = L.addClick(log, 'Samosa', items, 4);
    log = L.addClick(log, 'Biscuit', items, 5);
    log = L.addClick(log, 'Biscuit', items, 6);
    log = L.addClick(log, 'Biscuit', items, 7);
    assert.equal(L.expectedCash(log, items), 64);
  });

  test('counts clicks for items not in list are ignored', () => {
    const log = [{ name: 'Mystery', ts: 1 }, { name: 'Tea', ts: 2 }];
    assert.equal(L.expectedCash(log, items), 12);
  });
});

describe('price at click time', () => {
  const items = L.defaultItems();

  test('editing an item price does not change earlier sales', () => {
    let its = L.defaultItems();
    let log = [];
    // 2 teas at 12 each = 24
    log = L.addClick(log, 'Tea', its, 1);
    log = L.addClick(log, 'Tea', its, 2);
    assert.equal(L.expectedCash(log, its), 24);

    // owner raises tea price to 20 mid-day
    its = its.map(function (it) { return it.name === 'Tea' ? { name: 'Tea', price: 20 } : it; });
    // earlier clicks still worth 12 each → 24, not 40
    assert.equal(L.expectedCash(log, its), 24);

    // a new click at the new price
    log = L.addClick(log, 'Tea', its, 3);
    // 12 + 12 + 20 = 44
    assert.equal(L.expectedCash(log, its), 44);
  });

  test('removing an item keeps its past clicks in expected cash', () => {
    let its = L.defaultItems();
    let log = [];
    log = L.addClick(log, 'Tea', its, 1);
    log = L.addClick(log, 'Tea', its, 2);
    log = L.addClick(log, 'Samosa', its, 3);
    // 12 + 12 + 10 = 34
    assert.equal(L.expectedCash(log, its), 34);

    // remove Samosa — its clicks stay, still worth 10
    its = L.removeItem(its, its.findIndex(function (it) { return it.name === 'Samosa'; }));
    assert.equal(L.expectedCash(log, its), 34);
    // Samosa is no longer clickable
    assert.throws(function () { L.addClick(log, 'Samosa', its, 4); }, /Unknown item/);
  });

  test('renaming an item follows the clicks but keeps stored prices', () => {
    let its = L.defaultItems();
    let log = [];
    log = L.addClick(log, 'Tea', its, 1);  // price 12
    log = L.addClick(log, 'Tea', its, 2);  // price 12
    assert.equal(L.expectedCash(log, its), 24);

    // rename Tea → Chai
    var r = L.renameItem(its, log, 'Tea', 'Chai');
    its = r.items;
    log = r.saleLog;

    // count badge follows: both clicks are now 'Chai'
    var counts = L.countsFromLog(log);
    assert.equal(counts.Chai, 2);
    assert.equal(counts.Tea, undefined);

    // expected cash unchanged (stored prices frozen at 12)
    assert.equal(L.expectedCash(log, its), 24);

    // old name no longer clickable
    assert.throws(function () { L.addClick(log, 'Tea', its, 3); }, /Unknown item/);
    // new name works at current price
    var log2 = L.addClick(log, 'Chai', its, 3);
    // 12 + 12 + 12 = 36
    assert.equal(L.expectedCash(log2, its), 36);
  });

  test('old clicks without a price field fall back to current item price', () => {
    // simulate old localStorage data: clicks with no price
    var oldLog = [{ name: 'Tea', ts: 1 }, { name: 'Coffee', ts: 2 }];
    // 12 + 15 = 27 via fallback
    assert.equal(L.expectedCash(oldLog, items), 27);
  });
});

describe('removeItem', () => {
  test('removes the item at index', () => {
    var items = L.defaultItems();
    var next = L.removeItem(items, 1); // remove Coffee
    assert.equal(next.length, 3);
    assert.equal(next.find(function (it) { return it.name === 'Coffee'; }), undefined);
  });

  test('is immutable — original unchanged', () => {
    var items = L.defaultItems();
    L.removeItem(items, 0);
    assert.equal(items.length, 4);
  });

  test('resets to defaults when last item removed', () => {
    var items = [{ name: 'Only', price: 1 }];
    var next = L.removeItem(items, 0);
    assert.deepEqual(next, L.defaultItems());
  });

  test('out-of-range index returns a copy unchanged', () => {
    var items = L.defaultItems();
    var next = L.removeItem(items, 99);
    assert.deepEqual(next, items);
    assert.notEqual(next, items);
  });

  test('non-array input returns defaults', () => {
    assert.deepEqual(L.removeItem(null, 0), L.defaultItems());
  });
});

describe('renameItem', () => {
  test('renames the item and rewrites click names', () => {
    var items = L.defaultItems();
    var log = [];
    log = L.addClick(log, 'Tea', items, 1);
    log = L.addClick(log, 'Coffee', items, 2);
    var r = L.renameItem(items, log, 'Tea', 'Chai');
    assert.equal(r.items.find(function (it) { return it.name === 'Chai'; }).price, 12);
    assert.equal(r.items.find(function (it) { return it.name === 'Tea'; }), undefined);
    assert.equal(r.saleLog[0].name, 'Chai');
    assert.equal(r.saleLog[1].name, 'Coffee'); // untouched
  });

  test('preserves stored prices on renamed clicks', () => {
    var items = L.defaultItems();
    var log = [];
    log = L.addClick(log, 'Tea', items, 1); // price 12
    var r = L.renameItem(items, log, 'Tea', 'Chai');
    assert.equal(r.saleLog[0].price, 12); // frozen, not re-looked-up
  });

  test('rejects a name that already exists on another item', () => {
    var items = L.defaultItems();
    var log = [];
    log = L.addClick(log, 'Tea', items, 1);
    var r = L.renameItem(items, log, 'Tea', 'Coffee'); // Coffee exists
    // unchanged — same references returned
    assert.equal(r.items, items);
    assert.equal(r.saleLog, log);
    assert.equal(r.saleLog[0].name, 'Tea');
  });

  test('rejects an invalid new name', () => {
    var items = L.defaultItems();
    var log = [];
    log = L.addClick(log, 'Tea', items, 1);
    var r = L.renameItem(items, log, 'Tea', '   ');
    assert.equal(r.items, items);
    assert.equal(r.saleLog[0].name, 'Tea');
  });

  test('is immutable — original arrays unchanged', () => {
    var items = L.defaultItems();
    var log = [];
    log = L.addClick(log, 'Tea', items, 1);
    L.renameItem(items, log, 'Tea', 'Chai');
    assert.equal(items.find(function (it) { return it.name === 'Chai'; }), undefined);
    assert.equal(log[0].name, 'Tea');
  });

  test('trims whitespace in the new name', () => {
    var items = L.defaultItems();
    var log = [];
    log = L.addClick(log, 'Tea', items, 1);
    var r = L.renameItem(items, log, 'Tea', '  Chai  ');
    assert.ok(r.items.find(function (it) { return it.name === 'Chai'; }) !== undefined);
    assert.equal(r.saleLog[0].name, 'Chai');
  });
});

describe('toNumber', () => {
  test('parses numeric strings', () => {
    assert.equal(L.toNumber('42'), 42);
    assert.equal(L.toNumber(42), 42);
  });

  test('parses decimals', () => {
    assert.equal(L.toNumber('12.5'), 12.5);
  });

  test('empty / null / undefined → 0', () => {
    assert.equal(L.toNumber(''), 0);
    assert.equal(L.toNumber(null), 0);
    assert.equal(L.toNumber(undefined), 0);
  });

  test('non-numeric → 0', () => {
    assert.equal(L.toNumber('abc'), 0);
    assert.equal(L.toNumber(NaN), 0);
  });

  test('negative → 0 (money cannot be negative)', () => {
    assert.equal(L.toNumber(-5), 0);
    assert.equal(L.toNumber('-3'), 0);
  });
});

describe('gapVerdict', () => {
  const items = L.defaultItems();

  test('status "ok" when received equals expected', () => {
    // 2 tea = 24, UPI 14 + cash 10 = 24
    let log = [];
    log = L.addClick(log, 'Tea', items, 1);
    log = L.addClick(log, 'Tea', items, 2);
    const v = L.gapVerdict(log, items, 14, 10);
    assert.equal(v.expected, 24);
    assert.equal(v.received, 24);
    assert.equal(v.gap, 0);
    assert.equal(v.status, 'ok');
    assert.equal(v.upi, 14);
    assert.equal(v.cash, 10);
  });

  test('status "short" when received less than expected (money missing)', () => {
    // expected 36, received 30 → gap -6
    let log = [];
    log = L.addClick(log, 'Tea', items, 1);
    log = L.addClick(log, 'Tea', items, 2);
    log = L.addClick(log, 'Tea', items, 3);
    const v = L.gapVerdict(log, items, 20, 10);
    assert.equal(v.expected, 36);
    assert.equal(v.received, 30);
    assert.equal(v.gap, -6);
    assert.equal(v.status, 'short');
  });

  test('status "over" when received more than expected (sales not clicked)', () => {
    // expected 12, received 20 → gap +8
    let log = [];
    log = L.addClick(log, 'Tea', items, 1);
    const v = L.gapVerdict(log, items, 20, 0);
    assert.equal(v.expected, 12);
    assert.equal(v.received, 20);
    assert.equal(v.gap, 8);
    assert.equal(v.status, 'over');
  });

  test('no sales with zero received → ok', () => {
    const v = L.gapVerdict([], items, 0, 0);
    assert.equal(v.expected, 0);
    assert.equal(v.received, 0);
    assert.equal(v.status, 'ok');
  });

  test('no sales but cash entered → over', () => {
    const v = L.gapVerdict([], items, 0, 50);
    assert.equal(v.expected, 0);
    assert.equal(v.received, 50);
    assert.equal(v.gap, 50);
    assert.equal(v.status, 'over');
  });

  test('invalid money input is treated as 0 (never breaks arithmetic)', () => {
    let log = [];
    log = L.addClick(log, 'Tea', items, 1);
    const v = L.gapVerdict(log, items, 'abc', null);
    assert.equal(v.upi, 0);
    assert.equal(v.cash, 0);
    assert.equal(v.received, 0);
    assert.equal(v.expected, 12);
    assert.equal(v.status, 'short');
  });

  test('decimals in UPI/cash handled correctly', () => {
    let log = [];
    log = L.addClick(log, 'Biscuit', items, 1);
    // 1 biscuit = 5, UPI 2.5 + cash 2.5 = 5
    const v = L.gapVerdict(log, items, 2.5, 2.5);
    assert.equal(v.received, 5);
    assert.equal(v.status, 'ok');
  });
});

describe('totalClicks', () => {
  test('counts clicks in log', () => {
    assert.equal(L.totalClicks([]), 0);
    assert.equal(L.totalClicks([{ name: 'Tea', ts: 1 }]), 1);
    assert.equal(L.totalClicks([{ name: 'Tea', ts: 1 }, { name: 'Tea', ts: 2 }]), 2);
  });

  test('non-array → 0', () => {
    assert.equal(L.totalClicks(null), 0);
  });
});

describe('todayKey', () => {
  test('returns YYYY-MM-DD format', () => {
    const key = L.todayKey(new Date(2026, 10, 12)); // Nov 12 2026
    assert.equal(key, '2026-11-12');
  });

  test('zero-pads month and day', () => {
    assert.equal(L.todayKey(new Date(2026, 0, 5)), '2026-01-05');
  });

  test('defaults to current date when called with no arg', () => {
    assert.match(L.todayKey(), /^\d{4}-\d{2}-\d{2}$/);
  });
});
