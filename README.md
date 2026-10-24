# Shopiliar

Marketing site for Shopiliar — create your business website online.

Static HTML/CSS/JS, no build step. Open `index.html` in a browser or serve the folder:

```
python3 -m http.server 8000
```

## Pages
- `index.html` — Home
- `templates.html` — Templates (with category filters)
- `pricing.html` — Pricing (monthly / yearly toggle, FAQ)
- `signin.html` — Sign in
- `signup.html` — Sign up

Shared styles live in `assets/styles.css`, shared behaviour in `assets/main.js`.
The sign-in / sign-up forms are front-end only until a backend is connected.
