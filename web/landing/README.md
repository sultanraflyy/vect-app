# Vect Landing Page

This folder contains the **Vect** marketing landing page — a fully self-contained static HTML file that can be deployed independently (e.g. to Vercel, Netlify, or any static host) and served at `https://vect.app`.

## What's here

```
web/landing/
├── index.html   ← complete single-file landing page (HTML + Tailwind CDN + GSAP + vanilla JS)
└── README.md    ← this file
```

The page is **zero-dependency** — it loads Tailwind CSS, GSAP (with ScrollTrigger), and Google Fonts from CDNs at runtime. No build step, no `npm install`, nothing to compile.

---

## Design

Light, clean, enterprise-grade aesthetic inspired by cohere.com. Key design choices:

- **Fonts**: Inter (body), Instrument Serif (headlines), JetBrains Mono (data/numbers)
- **Animations**: GSAP-powered hero entrance, ScrollTrigger scroll reveals, animated stat counters
- **Layout**: Navbar → Hero with demo flow card → Alternating feature cards → Social proof marquee → Stats bar → Industries grid → 4-column pricing with toggle → FAQ accordion → CTA footer

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

All pricing data is inline in `index.html`. The pricing toggle uses `data-price-monthly` and `data-price-annual` attributes.

| Section | What to change |
|---------|---------------|
| **Plan prices** | Find `data-price-monthly` / `data-price-annual` attributes |
| **Plan credits** | Find credit counts in the feature `<ul>` lists |
| **Contact email** | Search for `hello@vect.app` |

---

## Brand colours (for reference)

| Token | Hex |
|-------|-----|
| Primary text | `#0F172A` |
| Secondary text | `#1E293B` |
| Muted text | `#64748B` |
| Accent blue | `#2563EB` |
| Success green | `#10B981` |
| Warning amber | `#F59E0B` |
| Border | `#E2E8F0` |
| Surface | `#F8FAFC` |

---

## Local preview

```bash
# macOS / Linux
open web/landing/index.html

# Or serve with any static file server
npx serve web/landing
```

No build required — it's just HTML.
