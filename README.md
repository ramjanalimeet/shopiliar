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
- `src/styles/` — the stylesheets, imported by the layouts and pages that need them.
- `public/assets/` — images, the storefront renderer's stylesheet, and the dashboard scripts (see below).

Each section has its own root layout (`RootHtml`), so the dashboards get their own `<body>` classes and fonts and
never share the website's header. Google Fonts load without blocking the first paint (preload, then a print
stylesheet switched on when it arrives), as before.

## Dashboards
The store dashboard (`/admin`), the live demo and the master dashboard are large vanilla-JavaScript apps. They were
kept as they are and are served from `public/assets/`:

| File | What it is |
|---|---|
| `dash.js` | Shared helpers, icons, `Dash.PLANS()` and `Dash.TEMPLATES()` |
| `admin-app.js` | The store owner dashboard: orders, products, customers, analytics, marketing, discounts, settings |
| `editor.js`, `site.js`, `site.css` | The website editor and the storefront renderer (`site.css` is loaded inside the preview frame) |
| `inbox.js` | Chat with the Shopilier team |
| `password.js` | Show/hide password fields in the dashboard |
| `demo.js` | Stands in for the account API on `/demo/app` (sample store in `localStorage`, `shopilier.demo`) |
| `master-admin.js` | The master dashboard (its data still lives in the browser) |

React renders each dashboard's shell (`src/components/dash/`); `LegacyScripts` then loads the scripts in order once
the page has hydrated. They find the same elements and ids they always did, so every feature works unchanged:
orders, products, the website editor with desktop/tablet/phone previews, versions and backups, publishing, image
uploads, plan limits, the support chat, and the demo's "Reset demo". Rewriting these engines as React components is
a separate project; nothing else in the app depends on how they are built.

## Plans
Defined in `src/lib/catalog.ts` (sign-up and pricing), mirrored in `Dash.PLANS()` (`public/assets/dash.js`, the
dashboards) and enforced by the API (`src/lib/plans.ts`):

| Plan | Price | Pages | Products | Staff | Custom domain | Support |
|---|---|---|---|---|---|---|
| Free | ৳0 | 5 | 3 | — | — (shopilier.com address) | — |
| Starter | ৳249/mo | 10 | 20 | 1 | Yes | Chat |
| Business | ৳549/mo | Unlimited | 100+ | 5 | Yes, free with yearly | Chat |
| Pro | ৳2,499/mo | Unlimited | Unlimited | Unlimited | Yes, free with yearly | Chat |

Accounts that never picked a plan start on Free.

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
- `/master-admin/api/users`, `/master-admin/api/conversations…` — the master dashboard's API. Cloudflare Access
  guards `/master-admin`, and these handlers verify the signed Access token (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` in
  `wrangler.jsonc`). Locally, `ACCESS_DEV_BYPASS=1` in `.dev.vars` lets you open it without Access.

Writes must come from this site (the `Origin` header is checked) and send JSON, except image uploads.

## Get started (sign-up)
`/signup` (`src/components/site/StartFlow.tsx`) walks new users through: pick a template or **Create with AI** →
plan → account, then opens their dashboard. Links from Pricing (`?plan=&billing=`) and Templates (`?template=`) skip
the steps already chosen. Text written with AI is handed to the new dashboard through `sessionStorage`. Online
payment isn't connected yet; the plan starts without charging.

## Speed
Marketing pages are prerendered at build time. Google Fonts don't block the first paint, the video player and its
poster only load when someone reaches for a play button, the demo page's frame loads the dashboard on its own, `/admin`
preloads `/api/me` alongside its scripts, and `public/_headers` lets browsers cache scripts, styles and images
(10 minutes, a day for images, refreshed in the background; Next.js build output for good). The old `.html`
addresses redirect to the clean URLs.

## Deploying
```
npm run preview       # builds with OpenNext and runs the Worker locally (wrangler dev)
npm run deploy        # builds and deploys to Cloudflare Workers (see wrangler.jsonc)
npm run db:remote     # applies schema.sql to the production database
```

The Worker is built in two steps: `npx opennextjs-cloudflare build` turns the Next.js app into
`.open-next/worker.js` and `.open-next/assets`, then `npx opennextjs-cloudflare deploy` (or `npx wrangler deploy`,
which hands over to it) uploads them. A deploy without the build step stops with "Open Next build not found".

**Cloudflare Workers Builds** (the GitHub connection that deploys `main`): in the Cloudflare dashboard open
Workers & Pages → `shopiliar` → Settings → Build and set

| Setting | Value |
|---|---|
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |

Build-time packages (`next`, `@opennextjs/cloudflare`, `wrangler`, `typescript`, the type packages) are regular
dependencies, so the build works even where development dependencies aren't installed.

After changing `wrangler.jsonc`, run `npm run cf-typegen` to refresh `cloudflare-env.d.ts`.
