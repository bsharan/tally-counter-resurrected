// src/i18n.js
// Telugu + English UI strings for Tally Counter, Resurrected.
// Exposes window.I18n with t(lang, key, params) and money(lang, amount).

(function (root) {
  'use strict';

  var STRINGS = {
    en: {
      app_title: 'Tally Counter',
      app_subtitle: 'Resurrected',
      expected_cash: 'Expected cash',
      items: 'Items',
      undo_last: 'Undo last',
      clear_day: 'Clear day',
      today_clicks: '{n} clicks',
      no_sales: 'No sales yet',
      edit_items: 'Edit items',
      add_item: 'Add item',
      item_name_ph: 'Item name',
      item_price_ph: '₹ Price',
      save: 'Save',
      cancel: 'Cancel',
      remove: 'Remove',
      night_check: 'Night check',
      upi_total: 'UPI total',
      cash_in_box: 'Cash in box',
      check: 'Check',
      gap_verdict: 'Gap verdict',
      money_missing: 'Money missing',
      sales_not_clicked: 'Sales not clicked',
      all_good: 'All good',
      expected: 'Expected',
      received: 'Received',
      gap: 'Gap',
      clear_confirm: 'Clear all of today\'s sales?',
      invalid_item: 'Enter a name and a valid price.',
      dup_item: 'That item already exists.',
      nothing_to_undo: 'Nothing to undo.',
      close: 'Close',
      per_unit: '₹{price} each',
      close_the_day: 'Close the day',
      settings: 'Settings',
      back: 'Back',
      gear_aria: 'Edit items',
      back_aria: 'Back to main screen'
    },
    te: {
      app_title: 'టాలీ కౌంటర్',
      app_subtitle: 'తిరిగి బ్రతికించాం',
      expected_cash: 'ఊహించిన నగదు',
      items: 'వస్తువులు',
      undo_last: 'చివరి తీసివేయి',
      clear_day: 'రోజు క్లియర్',
      today_clicks: '{n} క్లిక్‌లు',
      no_sales: 'ఇంకా అమ్మకాలు లేవు',
      edit_items: 'వస్తువులు సవరించండి',
      add_item: 'వస్తువు జోడించండి',
      item_name_ph: 'వస్తువు పేరు',
      item_price_ph: '₹ ధర',
      save: 'దాచు',
      cancel: 'రద్దు',
      remove: 'తీసివేయి',
      night_check: 'రాత్రి తనిఖీ',
      upi_total: 'యూపీఐ మొత్తం',
      cash_in_box: 'పెట్టెలో నగదు',
      check: 'తనిఖీ చేయి',
      gap_verdict: 'తేడా వివరణ',
      money_missing: 'డబ్బు తగ్గింది',
      sales_not_clicked: 'క్లిక్ చేయని అమ్మకాలు',
      all_good: 'అంతా బాగుంది',
      expected: 'ఊహించినది',
      received: 'వచ్చినది',
      gap: 'తేడా',
      clear_confirm: 'ఈ రోజు అమ్మకాలన్నీ తీసివేయాలా?',
      invalid_item: 'పేరు మరియు సరైన ధర ఇవ్వండి.',
      dup_item: 'ఆ వస్తువు ఇప్పటికే ఉంది.',
      nothing_to_undo: 'తీసివేయడానికి ఏమీ లేదు.',
      close: 'మూయి',
      per_unit: '₹{price} ఒకటి',
      close_the_day: 'రోజు మూసేయి',
      settings: 'సెట్టింగ్‌లు',
      back: 'వెనుకకు',
      gear_aria: 'వస్తువులు సవరించండి',
      back_aria: 'మెయిన్ స్క్రీన్‌కు వెళ్ళండి'
    }
  };

  // Lookup a string. Falls back to English if the key is missing for the lang.
  function t(lang, key, params) {
    var dict = STRINGS[lang] || STRINGS.en;
    var str = dict[key];
    if (str === undefined) {
      str = STRINGS.en[key];
    }
    if (str === undefined) return key;
    if (params) {
      Object.keys(params).forEach(function (p) {
        str = str.replace(new RegExp('\\{' + p + '\\}', 'g'), params[p]);
      });
    }
    return str;
  }

  // Format money with ₹ and no trailing .00 for whole numbers.
  function money(lang, amount) {
    var n = Number(amount) || 0;
    var rounded = Math.round(n * 100) / 100;
    var s = (rounded % 1 === 0)
      ? String(Math.round(rounded))
      : rounded.toFixed(2);
    return '\u20B9' + s; // ₹ symbol
  }

  root.I18n = { t: t, money: money, STRINGS: STRINGS };
})(typeof self !== 'undefined' ? self : this);
