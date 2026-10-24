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
- `signup.html` — Sign up (creates the account and opens `/admin`; `?template=` / `?plan=` carry the pick from Templates or Pricing)

Shared styles live in `public/assets/styles.css`, shared behaviour in `public/assets/main.js`. Deployed to Cloudflare Workers with `npx wrangler deploy` (see `wrangler.jsonc`).

## Accounts
`src/index.js` is the Worker. It serves `public/` and an account API backed by the D1 database `shopiliar-db` (tables in `schema.sql`):

- `POST /api/signup`, `POST /api/signin`, `POST /api/signout` — passwords hashed with PBKDF2, session in an HttpOnly cookie, 10 attempts/min per IP
- `GET /api/me` — the signed-in account and its store
- `PUT /api/store` — saves the store dashboard and account details

- `GET /api/auth/google` — "Continue with Google". It signs people in once the Worker has Google keys:
  create an OAuth client (Web application) in Google Cloud with the redirect URI
  `https://<your site>/api/auth/google/callback`, then run
  `npx wrangler secret put GOOGLE_CLIENT_ID` and `npx wrangler secret put GOOGLE_CLIENT_SECRET`

`/admin` redirects to sign in when there is no session. Local development:

```
npx wrangler d1 execute shopiliar-db --local --file=schema.sql
npx wrangler dev
```

## Dashboards
- `/admin` — store owner dashboard (Notion style): home, orders, products, customers,
  analytics, simple website customizer with live preview, pages, settings, plan & billing.
- `/master-admin` — business owner dashboard: overview, users, templates (add, customize,
  publish/unpublish, duplicate, delete), payments, plans & pricing, activity, settings.

Shared files: `public/assets/dash.css` and `public/assets/dash.js`.

The store dashboard (`/admin`) is saved to the signed-in account. The master dashboard still keeps
its data in the browser (`localStorage`) and is protected with Cloudflare Access.
