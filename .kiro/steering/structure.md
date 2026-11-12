---
inclusion: always
---
# Structure

```
index.html          the app (one page)
src/logic.js        counts, expected cash, gap verdict (pure functions, no DOM)
src/app.js          UI wiring, storage, voice, calls to the AI endpoint
src/i18n.js         Telugu + English strings
sw.js               service worker (offline)
tests/logic.test.js node --test
lambda/handler.py   Bedrock calls: parse_sale, explain_day
lambda/test_handler.py
esp32/clicker.ino   stretch: physical clicker
.kiro/              steering, specs, hooks (never gitignored)
```
Keep functions small; one responsibility per file; comments only where the "why" is not obvious.
