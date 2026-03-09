# Vect Landing Page

This folder contains the **Vect** marketing landing page — a fully self-contained static HTML file that can be deployed independently (e.g. to Vercel, Netlify, or any static host) and served at `https://vect.app`.

## What's here

```
web/landing/
├── index.html   ← complete single-file landing page (HTML + Tailwind CDN + vanilla JS)
└── README.md    ← this file
```

The page is **zero-dependency** — it loads Tailwind CSS from the CDN and Google Fonts at runtime. No build step, no `npm install`, nothing to compile.

---

## Deploy to Vercel

### Option A — Drag & drop (fastest)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Browse"** and select this `web/landing/` folder
3. Vercel detects a static site automatically — click **Deploy**
4. Point your domain (`vect.app`) to the generated Vercel URL

### Option B — Vercel CLI

```bash
# Install the CLI once
npm i -g vercel

# From this directory
cd web/landing
vercel --prod
```

Vercel will detect the static `index.html` and deploy immediately. Add your custom domain in the Vercel dashboard under **Settings → Domains**.

### Option C — GitHub integration (recommended for ongoing updates)

1. Connect your GitHub repo to Vercel
2. Set the **Root Directory** to `web/landing`
3. Every push to `main` auto-deploys the landing page

---

## Deploy to Netlify

Drop the `web/landing/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop) — done in 10 seconds.

---

## Updating pricing

All pricing data is inline in `index.html`. Search for the following comments to locate each section:

| Section | What to change |
|---------|---------------|
| **Plan prices** | Find `$14.99` / `$149` and update the `<span>` text |
| **Plan credits** | Find `1,500 standard` etc. in the feature lists |
| **Top-Up bundles** | Find the `<!-- Standard credits -->` and `<!-- Deep credits -->` blocks |
| **LemonSqueezy URLs** | Search for `lemonsqueezy.com/checkout/` and update slugs |
| **Contact email** | Search for `hello@vect.app` |

---

## Brand colours (for reference)

| Token | Hex |
|-------|-----|
| Navy background | `#0A1628` |
| Navy card | `#0F1F3D` |
| Blue accent | `#0284C7` |
| Sky text | `#38BDF8` |
| Gold (Business) | `#F59E0B` |
| Success green | `#10B981` |
| Light text | `#F1F5F9` |
| Muted text | `#94A3B8` |

---

## Local preview

```bash
# macOS / Linux
open web/landing/index.html

# Or serve with any static file server
npx serve web/landing
```

No build required — it's just HTML.
