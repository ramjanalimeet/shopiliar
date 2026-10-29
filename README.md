# Shopilier

Marketing site for Shopilier — create your online store.

Static HTML/CSS/JS, no build step. Site files live in `public/`. Open `public/index.html` in a browser or serve the folder:

```
python3 -m http.server 8000 -d public
```

## Pages
- `index.html` — Home
- `templates.html` — Templates (search, sort and live preview)
- `pricing.html` — Pricing (Free, Starter, Business and Pro; monthly / yearly toggle, FAQ)
- `demo/` — Live demo: the real store dashboard on a sample store, no sign-up (see below)
- `signin.html` — Sign in
- `signup.html` — Get started: the step-by-step sign-up (see below)
- `resources.html` — Resources: guide video and blog
- `contact.html` — Contact Us (the form opens the visitor's email app)
- `privacy.html` — Privacy Policy

Shared styles live in `public/assets/styles.css`, shared behaviour in `public/assets/main.js`. Deployed to Cloudflare Workers with `npx wrangler deploy` (see `wrangler.jsonc`).

## Plans
Defined once in `Dash.PLANS()` (`public/assets/dash.js`) and mirrored on the public Pricing page and in the Worker's `PLANS` list:

| Plan | Price | Pages | Products | Staff | Custom domain | Support |
|---|---|---|---|---|---|---|
| Free | ৳0 | 5 | 3 | — | — (shopilier.com address) | — |
| Starter | ৳249/mo | 10 | 20 | 1 | Yes | Chat |
| Business | ৳549/mo | Unlimited | 100+ | 5 | Yes, free with yearly | Chat |
| Pro | ৳2,499/mo | Unlimited | Unlimited | Unlimited | Yes, free with yearly | Chat |

The store dashboard enforces these (Products, Pages, Staff, Settings → Domain, and the support chat), and accounts that never
picked a plan start on Free.

## Accounts
`src/index.js` is the Worker. It serves `public/` and an account API backed by the D1 database `shopiliar-db` (tables in `schema.sql`):

- `POST /api/signup`, `POST /api/signin`, `POST /api/signout` — passwords hashed with PBKDF2, session in an HttpOnly cookie, 10 attempts/min per IP
- `GET /api/me` — the signed-in account and its store
- `PUT /api/store` — saves the store dashboard and account details

- `GET /api/auth/google` — "Continue with Google". It signs people in once the Worker has Google keys:
  create an OAuth client (Web application) in Google Cloud with the redirect URI
  `https://<your site>/api/auth/google/callback`, then run
  `npx wrangler secret put GOOGLE_CLIENT_ID` and `npx wrangler secret put GOOGLE_CLIENT_SECRET`

`/admin` redirects to sign in when there is no session (its scripts, `/admin/app.js` and `/admin/editor.js`, are served to
everyone because the demo loads them too). Local development:

```
npx wrangler d1 execute shopiliar-db --local --file=schema.sql
npx wrangler dev
```

## Get started (sign-up)
`signup.html` + `assets/start.js` walk new users through: pick a template or **Create with AI** →
plan → account, then open their dashboard. Links from Pricing and Templates skip the steps already chosen.
Create with AI calls `POST /api/ai/site`, which uses Workers AI (the `AI` binding) and falls back to simple
rules when AI isn't available. Online payment isn't connected yet; the plan starts without charging.

## Dashboards
- `/admin` — the store owner dashboard (`admin/app.js`): orders, products, customers, analytics,
  marketing, discounts and settings. Online Store opens Themes (desktop and phone preview, Customize,
  versions & backups), Pages, Navigation (menu order) and Preferences (search listing, social links).
  Settings (a popup) holds General, Plan & billing, Domain, Payments, Notifications, Account & security
  and Help Center. Messages with the Shopilier team open from the green chat button at the bottom right.
  Shopilier is for online stores only.
- `/master-admin` — business owner dashboard: overview, users, templates (add, customize,
  publish/unpublish, duplicate, delete), payments, plans & pricing, activity, settings.

Shared files: `public/assets/dash.css` and `public/assets/dash.js`.

## Live demo (`/demo`)
`demo/index.html` is the store dashboard shell with a demo bar on top, loading the same scripts as `/admin`.
`assets/demo.js` loads first and stands in for the account API: it answers `/api/me`, `/api/store`, `/api/messages`,
`/api/password` and `/api/upload` in the browser and keeps the sample store ("Dhaka Threads") in `localStorage`
(`shopilier.demo`). Visitors can add products, record orders, customize and publish the website, and chat (replies are
canned); uploaded photos are kept inline as data URLs. "Reset demo" clears the saved sample store.

## Website editor
Online Store → Themes → **Customize** opens the full-screen editor (`admin/editor.js`, `assets/editor.css`).
Each page is a list of sections (hero, products, featured, categories, about, testimonials, blog,
newsletter, contact, FAQ, image banner, custom); every section can also hold extra elements
(heading, text, button, image, spacer, divider). The header and footer are shared by all pages.
The website itself is rendered by `assets/site.js` with `assets/site.css`, in an iframe at desktop,
tablet or phone width, and the same renderer powers the Themes previews and "View your store".

Images uploaded in the editor go to `POST /api/upload` (signed in, JPG/PNG/WebP/GIF up to 1.5 MB,
300 per account; the browser shrinks photos to 1600px first). They're stored in the D1 `media`
table, which the Worker creates on first upload, and served from `/media/<id>`.

The store dashboard (`/admin`) is saved to the signed-in account. The master dashboard still keeps
its data in the browser (`localStorage`) and is protected with Cloudflare Access.
