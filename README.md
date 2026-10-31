# Shopilier

Shopilier — create your online store. A [Next.js](https://nextjs.org) app (App Router, TypeScript) deployed to
Cloudflare Workers with [OpenNext](https://opennext.js.org/cloudflare), backed by the D1 database `shopiliar-db`.

```
npm install
npm run db:local      # creates the tables in a local D1 database (once)
npm run dev           # http://localhost:3000 with the same bindings as production
```

`npm run dev` runs `next dev` with wrangler's local bindings (D1, the sign-in rate limiter). Workers AI only runs on
Cloudflare: "Create with AI" uses its simple rules locally unless you run `wrangler login` and start with
`NEXT_DEV_REMOTE_BINDINGS=1 npm run dev`. Secrets for local development go in `.dev.vars` (see `.dev.vars.example`).

## Layout
- `src/app/(site)/` — the public website: home, templates, pricing, demo, resources, contact, privacy, sign in and
  the step-by-step sign-up. Server components with small client components for the interactive parts
  (`src/components/site/`). Addresses that don't exist show the home page with a 404 status.
- `src/app/(admin)/admin/` — the store owner dashboard. The page checks the session cookie on the server and sends
  visitors to `/signin?next=…` otherwise.
- `src/app/(demo-app)/demo/app/` — the live demo: the same dashboard on a sample store kept in the browser.
- `src/app/(master)/master-admin/` — the business owner dashboard (protected with Cloudflare Access).
- `src/app/api/`, `src/app/master-admin/api/`, `src/app/media/` — the account API as route handlers (below).
- `src/lib/` — server code shared by the API: sessions and passwords (`auth.ts`, `crypto.ts`), request guards
  (`http.ts`), account rules (`plans.ts`), support messages, Cloudflare Access token checks, Create with AI, media.
- `src/lib/catalog.ts` — plans and the template catalog as visitors see them (sign-up, pricing).
- `src/dashboard/` — the dashboards themselves (see below).
- `src/styles/` — the stylesheets, imported by the layouts and pages that need them.
- `public/assets/` — images and the storefront renderer's stylesheet (`site.css`, loaded inside the preview frame).

Each section has its own root layout (`RootHtml`), so the dashboards get their own `<body>` classes and fonts and
never share the website's header. Google Fonts load as normal stylesheets, so each page paints once in the right
fonts (the dashboards fetch only the ৳ sign from the Bengali font, in its own small request).

## Dashboards
The store dashboard (`/admin`), the live demo and the master dashboard are TypeScript modules in `src/dashboard/`,
bundled by Next.js. React renders each dashboard's shell (`src/components/dash/`), icons included, so nothing moves when the
dashboard starts; `AdminApp`, `DemoApp` and `MasterApp` ship the matching bundle with the page and call its
`start()` once the page has hydrated. The dashboard then takes over the shell (`#view`, the chat panel).

| Module | What it is |
|---|---|
| `dash.ts` | Shared helpers, icons, `Dash.PLANS()` and `Dash.TEMPLATES()` |
| `admin-app.ts` | The store owner dashboard: orders, products, customers, analytics, marketing, discounts, settings |
| `editor.ts`, `site.ts` | The website editor and the storefront renderer (`public/assets/site.css` is loaded inside the preview frame) |
| `inbox.ts` | Chat with the Shopilier team |
| `password.ts` | Show/hide password fields in the dashboard |
| `demo.ts` | Stands in for the account API on `/demo/app` (sample store in `localStorage`, `shopilier.demo`) |
| `master-admin.ts` | The master dashboard (its data still lives in the browser) |
| `*.entry.ts` | One entry per page: `start()` runs the pieces in the order they must run (`demo.ts` before the dashboard) |

### Template starter websites
A template can bring a whole website in its own language (`STARTERS` in `site.ts`): its pages in menu order, the
sections on each, the header, footer and Checkout text. **Fashion & Clothing** (`luxe-store`) is the first: a Bangla
T-shirt store with a big headline and photo slides, a feature strip, collection tiles, products with New / Best seller /
Sale buttons, a promo card, "Why us" cards and a newsletter bar. New stores on that template start from it, and
"Reset page" in the editor goes back to it. Its look lives in `public/assets/site.css` under `.theme-fashion`, and empty
photos show the size to upload (1920 × 800, 400 × 400, 600 × 600) in the editor and previews.

Store owners change all of it from the dashboard: every text, photo, slide, button and label in the website editor,
the layout from each section's Layout menu, product labels on the product form, and the website's own words (Add to
cart, the cart, prices) with **Website language** in Preferences. `/templates/preview/<id>` serves the real storefront
on sample products; the Templates page shows it in the card and in the Preview popup.

The starter's photos are free stock photos from Unsplash and Pexels (both licences allow commercial use without
credit), cropped and saved as WebP in `public/assets/templates/fashion/` (about 520 KB for all 17). New stores start
with them on the hero slides, collection tiles, promo card and About page, and the demo store's sample products use
them too; owners replace any of them from the editor. `safeImg` accepts `/assets/templates/…` addresses for this.

These modules were ported from the original dashboard scripts and are marked `@ts-nocheck`: they run as written,
with every feature intact (orders, products, the website editor with desktop/tablet/phone previews, versions and
backups, publishing, image uploads, plan limits, the support chat, "Reset demo"), and their types can be tightened
piece by piece.

## Plans
Defined in `src/lib/catalog.ts` (sign-up and pricing), mirrored in `Dash.PLANS()` (`public/assets/dash.js`, the
dashboards) and enforced by the API (`src/lib/plans.ts`):

| Plan | Price | Pages | Products | Staff | Custom domain | Support |
|---|---|---|---|---|---|---|
| Starter | ৳149/mo | 10 | 10 | 2 | Yes | Chat |
| Business | ৳549/mo | Unlimited | 100+ | 10+ | Yes, free with yearly | Chat |
| Pro | ৳2,499/mo | Unlimited | Unlimited | Unlimited | Yes, free with yearly | Chat |

Every plan includes a free sub-domain (yourstore.shopilier.com). Accounts that never picked a plan start on Starter;
accounts still on the retired Free plan are treated as Starter.

## Accounts and the API
Accounts, sessions and each user's store live in D1 (tables in `schema.sql`). Route handlers:

- `POST /api/signup`, `POST /api/signin`, `POST /api/signout` — passwords hashed with PBKDF2, session in an HttpOnly
  cookie, 10 attempts/min per IP (the `AUTH_LIMITER` rate limit binding)
- `GET /api/me` — the signed-in account and its store
- `PUT /api/store` — saves the store dashboard and account details
- `POST /api/password` — change (or set) the password; signs out every other device
- `GET /api/messages`, `POST /api/messages`, `GET|POST /api/messages/<id>` — support conversations
- `POST /api/ai/site` — Create with AI (Workers AI, the `AI` binding, with simple rules as a fallback)
- `POST /api/upload`, `GET /media/<id>` — images uploaded in the website editor (JPG/PNG/WebP/GIF up to 1.5 MB,
  300 per account, stored in the D1 `media` table, which is created on first upload)
- `GET /api/auth/google`, `GET /api/auth/google/callback` — "Continue with Google". Create an OAuth client
  (Web application) in Google Cloud with the redirect URI `https://<your site>/api/auth/google/callback`, then run
  `npx wrangler secret put GOOGLE_CLIENT_ID` and `npx wrangler secret put GOOGLE_CLIENT_SECRET`
- `/master-admin/api/users` (list), `/master-admin/api/users/<id>` (PATCH edits a user; DELETE removes the account and
  everything in it, and needs the business name sent as `confirm`), `/master-admin/api/settings` (the Settings popup:
  website details, staff, payment details, the sign-up and maintenance switches), `/master-admin/api/templates/<id>/design`
  (the template builder) and `/master-admin/api/upload` (its photos) — the master dashboard's API. `GET /api/platform` and
  `GET /api/templates/<id>/design` are the public reads: the footer and Contact page use the first, new stores the second.
- `/master-admin/api/conversations…` — support messages in the master dashboard. Cloudflare Access
  guards `/master-admin`, and these handlers verify the signed Access token (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` in
  `wrangler.jsonc`). Locally, `ACCESS_DEV_BYPASS=1` in `.dev.vars` lets you open it without Access.

Writes must come from this site (the `Origin` header is checked) and send JSON, except image uploads.

## Get started (sign-up)
`/signup` (`src/components/site/StartFlow.tsx`) walks new users through: pick a template or **Create with AI** →
plan → account, then opens their dashboard. Links from Pricing (`?plan=&billing=`) and Templates (`?template=`) skip
the steps already chosen. Text written with AI is handed to the new dashboard through `sessionStorage`. Online
payment isn't connected yet; the plan starts without charging.

## Speed
Marketing pages are prerendered at build time. Fonts load as one stylesheet per page (so the page paints once, in the
right fonts), the video player and its poster only load when someone reaches for a play button, the demo page's frame
loads the dashboard on its own, and `/admin` preloads `/api/me` alongside its scripts. `public/_headers` keeps images
for a day while the storefront stylesheet in `public/assets` is revalidated on every load (so a deploy never pairs a
new page with an old file); Next.js build output, dashboards included, carries a hash in its name and is kept for good. The old
`.html` addresses redirect to the clean URLs.

## Deploying
```
npm run preview       # builds with OpenNext and runs the Worker locally (wrangler dev)
npm run deploy        # builds and deploys to Cloudflare Workers (see wrangler.jsonc)
npm run db:remote     # applies schema.sql to the production database
```

The Worker is built in two steps: `npx opennextjs-cloudflare build` turns the Next.js app into
`.open-next/worker.js` and `.open-next/assets`, then `npx opennextjs-cloudflare deploy` (or `npx wrangler deploy`,
which hands over to it) uploads them. A deploy without the build step stops with "Open Next build not found".

**Cloudflare Workers Builds** (the GitHub connection that deploys `main`) works with its default settings
(no build command, deploy command `npx wrangler deploy`): on that runner, `scripts/postinstall.mjs` builds the
Worker right after `npm install`, and the committed `.env` (`OPEN_NEXT_DEPLOY=true`, read by wrangler) makes
`wrangler deploy` upload that build directly instead of handing over to `opennextjs-cloudflare deploy`, which would
first open a remote session with Cloudflare to check caches this app doesn't use. You can also set the dashboard's
Build command to `npx opennextjs-cloudflare build`; both ways work.

Build-time packages (`next`, `@opennextjs/cloudflare`, `wrangler`, `typescript`, the type packages) are regular
dependencies, so the build works even where development dependencies aren't installed.

After changing `wrangler.jsonc`, run `npm run cf-typegen` to refresh `cloudflare-env.d.ts`.
