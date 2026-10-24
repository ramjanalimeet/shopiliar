# Shopiliar

Marketing site for Shopiliar — create your business website online.

Static HTML/CSS/JS, no build step. Site files live in `public/`. Open `public/index.html` in a browser or serve the folder:

```
python3 -m http.server 8000 -d public
```

## Pages
- `index.html` — Home
- `templates.html` — Templates (search, sort, category filters and live preview)
- `pricing.html` — Pricing (monthly / yearly toggle, FAQ)
- `signin.html` — Sign in
- `signup.html` — Sign up (creates the account and opens `/admin`)

Shared styles live in `public/assets/styles.css`, shared behaviour in `public/assets/main.js`. Deployed to Cloudflare Workers with `npx wrangler deploy` (see `wrangler.jsonc`).
The sign-in / sign-up forms are front-end only until a backend is connected.

## Dashboards
- `/admin` — store owner dashboard (Notion style): home, orders, products, customers,
  analytics, simple website customizer with live preview, pages, settings, plan & billing.
- `/master-admin` — business owner dashboard: overview, users, templates (add, customize,
  publish/unpublish, duplicate, delete), payments, plans & pricing, activity, settings.

Shared files: `public/assets/dash.css` and `public/assets/dash.js`.

Until a backend is connected, dashboard data is saved in the browser (`localStorage`),
so it is per device. Protect `/master-admin*` with Cloudflare Access before using real data.
