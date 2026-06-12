# Wedding Invitation Website

A production-ready, premium wedding invitation built with **Astro**, **Tailwind CSS**, and **TypeScript**. All content is driven by a single configuration file — no hardcoded copy in components.

## Features

- Fullscreen hero with scroll indicator
- Real-time countdown
- Story timeline
- Ceremony & reception with Google Maps links
- Dress code with inspiration images
- Gifts section with QR code and copy-to-clipboard
- Masonry gallery with lazy loading and lightbox
- Frontend RSVP stored in `localStorage`
- Background music player
- WhatsApp floating button
- Share invitation & Add to Google Calendar
- Dark mode
- Idioma único: español argentino (`es-AR`)
- Scroll progress bar & back-to-top button
- Confetti on successful RSVP
- SEO: Open Graph, Twitter cards, JSON-LD, sitemap, robots.txt

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Customize Your Wedding

Edit **`src/data/wedding.json`** — this is the only file you need to change for content:

| Section | What to update |
|---------|----------------|
| `couple` | Bride & groom names |
| `weddingDate` | ISO date/time for countdown & calendar |
| `hero.image` | Path to your hero photo in `public/images/` |
| `story` | Timeline entries with dates, titles, descriptions, images |
| `ceremony` / `reception` | Venue details & `mapsUrl` |
| `dressCode` | Description & inspiration images |
| `gifts` | Bank details & `qrImage` |
| `gallery` | Photo paths and alt text (EN/ES) |
| `socials` | Instagram & Facebook URLs |
| `music` | Set `enabled: false` or add `public/audio/wedding.mp3` |
| `whatsapp` | Phone number (country code, no `+`) |
| `ui` | Textos de la interfaz en español |
| `site.url` | Your live site URL for SEO |

Replace placeholder images in `public/images/` with your own photos (`.jpg`, `.webp`, or `.svg`).

## Project Structure

```
src/
├── components/     # Hero, Countdown, Story, RSVP, etc.
├── layouts/        # MainLayout (SEO, fonts, scripts)
├── pages/          # index.astro
├── data/           # wedding.json ← customize here
├── styles/         # global.css
├── scripts/        # client-side interactivity
├── types/          # TypeScript definitions
└── assets/         # Optional source assets
public/
├── images/         # Static images served as-is
├── audio/          # Background music file
└── robots.txt
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages → Build and deployment** and set source to **GitHub Actions**.
3. Update `site.url` in `wedding.json` to match your Pages URL, e.g. `https://your-username.github.io/wedding-lp`.
4. Push to the `main` branch — the workflow in `.github/workflows/deploy.yml` builds and deploys automatically.

The `base` path is set automatically in CI via `GITHUB_REPOSITORY`.

### Manual deploy

```bash
npm run build
# Upload contents of dist/ to your static host
```

## Performance & Accessibility

- Static Site Generation (SSG) — no backend
- Lazy-loaded gallery images
- `prefers-reduced-motion` respected
- Semantic HTML & ARIA labels
- Focus-visible styles

Target Lighthouse scores above 95 by replacing placeholders with optimized WebP/JPEG images.

## RSVP Data

RSVP responses are stored in the browser's `localStorage` under the key `wedding-rsvp-responses`. Export manually from DevTools → Application → Local Storage, or integrate a backend later.

## License

Private use for your wedding event.
