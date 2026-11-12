---
inclusion: always
---
# Product: Tally Counter, Resurrected

## The dead tech
The mechanical hand tally counter ("clicker"): a ₹50 metal device that shopkeepers, gatekeepers and bus conductors in India
clicked once per item for decades. It could only count. It forgot everything at night and never told you anything.

## The resurrection
The same one-click habit, reborn with AI for bill-less small shops (tea stalls, tiffin centres, pan shops) in Karimnagar,
Telangana:
- **Click** (a big on-screen button, or a physical ESP32 button) or **speak** ("rendu tea, oka samosa") once per sale.
- **Night check:** the owner types today's UPI total and the cash in the box; the app shows expected vs received and the gap:
  money missing, sales not clicked, or all good.
- **AI explains** the day in 3 short lines of Telugu or English (when the gap probably happened, best hour, best item), and the
  summary can be shared to WhatsApp.

## Users
Shop owners with a cheap Android phone, UPI QR plus cash, comfortable in Telugu, no time to type at peak hours.

## Rules that must never break
1. Money math (counts × prices, expected cash, gap) is deterministic code with unit tests. AI never does arithmetic.
2. AI output is grounded only in the day's numbers. If AI fails or is offline, the app still counts and shows the gap.
3. A wrong or unknown item never corrupts the counts; invalid input is rejected with a clear message.
4. Works offline; data stays on the phone unless the owner asks for the AI summary.
5. Telugu and English everywhere in the UI.
