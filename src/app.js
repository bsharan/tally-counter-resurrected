// src/app.js
// UI wiring, offline storage (localStorage), day rollover, view switching,
// and service worker registration for Tally Counter, Resurrected.
// No AI, no backend — that comes in spec 2.

(function () {
  'use strict';

  var L = window.TallyLogic;
  var I = window.I18n;

  // ---- storage keys ----
  var K_ITEMS = 'tally.items';
  var K_SALES = 'tally.sales';
  var K_DAY = 'tally.day';
  var K_LANG = 'tally.lang';

  // ---- app state ----
  var state = {
    items: [],
    saleLog: [],
    day: '',
    lang: 'en' // English is the default; Telugu stays behind the toggle
  };

  // ---------- storage helpers (every access in try/catch) ----------

  function storeGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function storeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------- load / persist ----------

  function loadState() {
    state.lang = storeGet(K_LANG, 'en');
    if (state.lang !== 'te' && state.lang !== 'en') state.lang = 'en';

    var savedItems = storeGet(K_ITEMS, null);
    state.items = L.validateItems(savedItems);
    if (state.items.length === 0) {
      state.items = L.defaultItems();
      storeSet(K_ITEMS, state.items);
    }

    // Day rollover: if the stored day differs from today, clear sales.
    state.day = L.todayKey();
    var savedDay = storeGet(K_DAY, '');
    if (savedDay === state.day) {
      state.saleLog = Array.isArray(storeGet(K_SALES, [])) ? storeGet(K_SALES, []) : [];
    } else {
      state.saleLog = [];
      storeSet(K_SALES, state.saleLog);
      storeSet(K_DAY, state.day);
    }
  }

  function persistItems() { storeSet(K_ITEMS, state.items); }
  function persistSales() { storeSet(K_SALES, state.saleLog); }
  function persistLang() { storeSet(K_LANG, state.lang); }

  // ---------- element refs ----------
  function el(id) { return document.getElementById(id); }

  // ---------- view switching ----------

  function showView(name) {
    el('view-main').hidden = name !== 'main';
    el('view-nightcheck').hidden = name !== 'nightcheck';
    el('view-settings').hidden = name !== 'settings';
    // scroll to top when switching views
    window.scrollTo(0, 0);
  }

  // ---------- rendering ----------

  function t(key, params) { return I.t(state.lang, key, params); }

  function renderStatic() {
    document.documentElement.lang = state.lang;

    // header
    el('title').textContent = t('app_title');
    el('subtitle').textContent = t('app_subtitle');
    el('langToggle').textContent = state.lang === 'en' ? 'తె' : 'EN';
    el('langToggle').setAttribute('aria-label',
      state.lang === 'en' ? 'తెలుగుకు మార్చండి' : 'Switch to English');
    el('gearBtn').setAttribute('aria-label', t('gear_aria'));

    // main view
    el('expectedLabel').textContent = t('expected_cash');
    el('itemGrid').setAttribute('aria-label', t('items'));
    el('undoBtn').textContent = t('undo_last');
    el('closeDayBtn').textContent = t('close_the_day');

    // night check view
    el('nightCheckTitle').textContent = t('night_check');
    el('upiLabel').textContent = t('upi_total');
    el('cashLabel').textContent = t('cash_in_box');
    el('checkBtn').textContent = t('check');
    el('nightBackBtn').textContent = t('back');
    el('nightBackBtn').setAttribute('aria-label', t('back_aria'));

    // settings view
    el('settingsTitle').textContent = t('settings');
    el('addItemBtn').textContent = t('add_item');
    el('newItemName').placeholder = t('item_name_ph');
    el('newItemPrice').placeholder = t('item_price_ph');
    el('settingsBackBtn').textContent = t('back');
    el('settingsBackBtn').setAttribute('aria-label', t('back_aria'));
  }

  function renderItemGrid() {
    var grid = el('itemGrid');
    grid.innerHTML = '';
    var counts = L.countsFromLog(state.saleLog);

    state.items.forEach(function (item) {
      var btn = document.createElement('button');
      btn.className = 'item-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', item.name + ' ' + t('per_unit', { price: item.price }));

      var nameEl = document.createElement('span');
      nameEl.className = 'item-name';
      nameEl.textContent = item.name;

      var priceEl = document.createElement('span');
      priceEl.className = 'item-price';
      priceEl.textContent = t('per_unit', { price: item.price });

      var count = counts[item.name] || 0;
      var countEl = document.createElement('span');
      countEl.className = 'item-count';
      countEl.textContent = String(count);
      if (count === 0) countEl.style.visibility = 'hidden';

      btn.appendChild(nameEl);
      btn.appendChild(priceEl);
      btn.appendChild(countEl);

      btn.addEventListener('click', function () { onItemClick(item.name); });
      grid.appendChild(btn);
    });
  }

  function renderExpected() {
    var amount = L.expectedCash(state.saleLog, state.items);
    el('expectedAmount').textContent = I.money(state.lang, amount);
  }

  function renderSummary() {
    var n = L.totalClicks(state.saleLog);
    el('salesSummary').textContent = n === 0 ? t('no_sales') : t('today_clicks', { n: n });
    el('undoBtn').disabled = n === 0;
  }

  function renderEditList() {
    var list = el('editList');
    list.innerHTML = '';

    state.items.forEach(function (item, index) {
      var row = document.createElement('div');
      row.className = 'edit-row';

      var nameInput = document.createElement('input');
      nameInput.className = 'e-name';
      nameInput.type = 'text';
      nameInput.value = item.name;
      nameInput.setAttribute('aria-label', t('item_name_ph'));

      var priceInput = document.createElement('input');
      priceInput.className = 'e-price';
      priceInput.type = 'number';
      priceInput.min = '0';
      priceInput.step = '1';
      priceInput.value = item.price;
      priceInput.setAttribute('aria-label', t('item_price_ph'));

      var removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.type = 'button';
      removeBtn.textContent = t('remove');
      removeBtn.setAttribute('aria-label', t('remove') + ' ' + item.name);

      // Save name on change — use renameItem so counts follow, prices stay frozen
      nameInput.addEventListener('change', function () {
        var oldName = state.items[index].name;
        if (nameInput.value.trim() === oldName) return; // no change
        var r = L.renameItem(state.items, state.saleLog, oldName, nameInput.value);
        if (r.items === state.items) {
          // rename rejected (invalid or duplicate) — revert input
          nameInput.value = oldName;
          return;
        }
        state.items = r.items;
        state.saleLog = r.saleLog;
        persistItems();
        persistSales();
        renderAll();
      });

      // Save price on change — only edits the item, never touches past clicks
      priceInput.addEventListener('change', function () {
        var v = L.validateItem({ name: nameInput.value, price: priceInput.value });
        if (!v || v.price < 0) {
          priceInput.value = state.items[index].price;
          return;
        }
        state.items[index].price = v.price;
        persistItems();
        renderAll();
      });

      removeBtn.addEventListener('click', function () {
        onRemoveItem(index);
      });

      row.appendChild(nameInput);
      row.appendChild(priceInput);
      row.appendChild(removeBtn);
      list.appendChild(row);
    });
  }

  function renderVerdict(verdict) {
    var box = el('verdictDisplay');
    box.hidden = false;
    box.innerHTML = '';

    var statusEl = document.createElement('div');
    statusEl.className = 'verdict-status ' + verdict.status;
    statusEl.textContent =
      verdict.status === 'short' ? t('money_missing') :
      verdict.status === 'over' ? t('sales_not_clicked') :
      t('all_good');
    box.appendChild(statusEl);

    var grid = document.createElement('div');
    grid.className = 'verdict-grid';

    function vrow(label, val) {
      var r = document.createElement('div');
      r.className = 'vrow';
      var l = document.createElement('span');
      l.className = 'vlabel';
      l.textContent = label;
      var v = document.createElement('span');
      v.className = 'vval';
      v.textContent = val;
      r.appendChild(l);
      r.appendChild(v);
      return r;
    }

    grid.appendChild(vrow(t('expected'), I.money(state.lang, verdict.expected)));
    grid.appendChild(vrow(t('received'), I.money(state.lang, verdict.received)));
    grid.appendChild(vrow(t('gap'),
      (verdict.gap < 0 ? '-' : verdict.gap > 0 ? '+' : '') + I.money(state.lang, Math.abs(verdict.gap))));
    box.appendChild(grid);
  }

  function renderAll() {
    renderStatic();
    renderItemGrid();
    renderExpected();
    renderSummary();
    renderEditList();
  }

  // ---------- handlers ----------

  function onItemClick(name) {
    try {
      state.saleLog = L.addClick(state.saleLog, name, state.items);
      persistSales();
    } catch (e) {
      // unknown item — never corrupts counts
      return;
    }
    renderItemGrid();
    renderExpected();
    renderSummary();
  }

  function onUndo() {
    if (state.saleLog.length === 0) return;
    state.saleLog = L.undoLast(state.saleLog);
    persistSales();
    renderItemGrid();
    renderExpected();
    renderSummary();
  }

  function onCloseDay() {
    // hide any stale verdict from a previous check
    el('verdictDisplay').hidden = true;
    showView('nightcheck');
  }

  function onCheck() {
    var upi = el('upiTotal').value;
    var cash = el('cashTotal').value;
    var verdict = L.gapVerdict(state.saleLog, state.items, upi, cash);
    renderVerdict(verdict);
  }

  function onAddItem(e) {
    e.preventDefault();
    var nameVal = el('newItemName').value;
    var priceVal = el('newItemPrice').value;
    var v = L.validateItem({ name: nameVal, price: priceVal });
    if (!v) {
      flashError(t('invalid_item'));
      return;
    }
    var exists = state.items.some(function (i) { return i.name === v.name; });
    if (exists) {
      flashError(t('dup_item'));
      return;
    }
    state.items.push(v);
    state.items.sort(compareItems);
    persistItems();
    el('newItemName').value = '';
    el('newItemPrice').value = '';
    renderAll();
  }

  function compareItems(a, b) {
    var an = a.name.toLowerCase();
    var bn = b.name.toLowerCase();
    return an < bn ? -1 : an > bn ? 1 : 0;
  }

  // Uses the new removeItem helper — clicks stay with their stored prices
  function onRemoveItem(index) {
    state.items = L.removeItem(state.items, index);
    persistItems();
    renderAll();
  }

  function toggleLang() {
    state.lang = state.lang === 'en' ? 'te' : 'en';
    persistLang();
    renderAll();
    // re-render verdict if visible so labels switch language
    if (!el('verdictDisplay').hidden) {
      onCheck();
    }
  }

  // small inline error flash under the add-item form
  var flashTimer = null;
  function flashError(msg) {
    var form = el('addItemForm');
    var existing = form.querySelector('.flash-err');
    if (existing) existing.remove();
    var span = document.createElement('span');
    span.className = 'flash-err';
    span.textContent = msg;
    form.appendChild(span);
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { if (span.parentNode) span.remove(); }, 2500);
  }

  // ---------- service worker ----------

  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () {
        // offline is a nice-to-have; ignore registration errors
      });
    }
  }

  // ---------- init ----------

  function init() {
    loadState();
    renderAll();
    showView('main');

    // header
    el('gearBtn').addEventListener('click', function () { showView('settings'); });
    el('langToggle').addEventListener('click', toggleLang);

    // main view
    el('undoBtn').addEventListener('click', onUndo);
    el('closeDayBtn').addEventListener('click', onCloseDay);

    // night check view
    el('checkBtn').addEventListener('click', onCheck);
    el('nightBackBtn').addEventListener('click', function () { showView('main'); });

    // settings view
    el('addItemForm').addEventListener('submit', onAddItem);
    el('settingsBackBtn').addEventListener('click', function () { showView('main'); });

    registerSW();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
