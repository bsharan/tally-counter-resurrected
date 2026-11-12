---
inclusion: always
---
# Tech

- **Frontend:** a single static Progressive Web App: plain HTML, CSS and JavaScript (no framework, no build step), so it runs on cheap phones
  and deploys to GitHub Pages. localStorage for data, every access wrapped in try/catch. Service worker for offline use.
- **Voice:** browser Web Speech API with `lang = "te-IN"` (fallback `en-IN`). The transcript goes to the AI parser; the parser's
  JSON is validated against the shop's item list before anything is counted.
- **AI backend:** one AWS Lambda function (Python 3.12) behind a Lambda Function URL, calling **Amazon Bedrock** (a small, cheap
  model, e.g. Amazon Nova Micro/Lite) for two jobs: (a) transcript → `[{item, qty}]` JSON; (b) day numbers → 3-line explanation.
  The prompts contain only that day's numbers. Strict CORS limited to the GitHub Pages origin; a per-request size limit.
- **Hardware (stretch):** ESP32 button sketch that sends a click over HTTPS; simulated on Wokwi.
- **Tests:** pure-JS money logic in `src/logic.js` with tests runnable in Node (`node --test`); Lambda parsing logic with pytest.
- **Cost guard:** the AWS budget is about $25 in credits. Keep Bedrock calls small; no always-on servers.
- License: MIT.
