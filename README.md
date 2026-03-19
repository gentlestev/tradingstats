# 📈 TradingStats

A professional trading journal and analytics dashboard — **TradeZella-inspired**, built fresh from scratch.

**Live demo:** https://gentlestev.github.io/tradingstats

---

## ✨ Features

| Feature | Description |
|---|---|
| **Stats Score** | Proprietary 0–100 score (like Zella Score) grading WR, PF, RRR & Expectancy |
| **Left Sidebar Layout** | TradeZella-style navigation with account selector |
| **Equity Curve** | FTMO green/red fill chart with custom baseline |
| **Performance Calendar** | Daily P&L heatmap calendar |
| **Trade Journal** | Emotion tagging, reasoning, what went well, lessons |
| **Analysis** | Win rate by instrument, monthly table, emotion analysis |
| **AI Screenshot Import** | Upload screenshots → AI extracts trades |
| **MT5 HTML Parser** | Native MT5 Trade History report parsing |
| **Multi-Firm** | Deriv · FTMO · The5ers · Other + All Trades aggregate |
| **Responsive** | Full mobile with sidebar drawer |
| **Supabase Auth** | Email + Google OAuth with multi-step registration |

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/gentlestev/tradingstats.git
cd tradingstats

# 2. Open in browser (no build step required)
open index.html
# or serve it:
npx serve .
```

This is a **vanilla HTML/CSS/JS** app — no build step, no dependencies to install.

---

## 📁 Project Structure

```
tradingstats/
├── index.html          # Main HTML shell + auth + app layout
├── css/
│   └── style.css       # Full design system (TradeZella-inspired)
├── js/
│   ├── app.js          # Bootstrap, navigation, clock
│   ├── auth.js         # Supabase auth, registration, validation
│   ├── data.js         # Global state, stats calculator, score
│   ├── parser.js       # MT5 HTML, CSV, XML, PDF, AI parsers
│   ├── charts.js       # Chart.js equity, daily, monthly, rings
│   └── pages.js        # All page renderers (dashboard→help)
└── README.md
```

---

## 🎨 Design

- **Fonts:** Plus Jakarta Sans + Space Mono + Familjen Grotesk
- **Palette:** Deep navy `#0f1117` · Signal green `#22d07a` · Brand blue `#4f8ef7`
- **Layout:** Left sidebar (240px) + main content area — TradeZella template
- **Breakpoints:** 1280px · 1024px · 768px · 480px

---

## ⚙️ Configuration

Edit `js/auth.js` to point to your own Supabase project:

```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

For AI screenshot parsing, save your Anthropic API key in the browser:
```js
localStorage.setItem('anthropic_key', 'sk-ant-...');
```

---

## 📦 Dependencies (CDN)

- [@supabase/supabase-js](https://supabase.com/docs/reference/javascript)
- [Chart.js 4.4.1](https://www.chartjs.org/)
- [chartjs-plugin-zoom 2.0.1](https://www.chartjs.org/chartjs-plugin-zoom/)
- [hammerjs 2.0.8](https://hammerjs.github.io/)
- [pdfjs-dist 3.11.174](https://mozilla.github.io/pdf.js/)

---

## 👤 Author

Built by **Osita Onyeje**
📧 nwaogalanyapaulinus@gmail.com

---

## 📄 License

MIT
