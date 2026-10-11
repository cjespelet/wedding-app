# LP — Invitación de 15 (demo)

Landing estática (Astro + Tailwind), estética negra / disco. **No toca** la LP de la boda.

Requiere **Node 22.12+** (`nvm use 22.12.0` si el default es más viejo).

## Demo local

```bash
cd xv-lp
npm install
npm run dev
```

Abrí [http://localhost:4322](http://localhost:4322).

## Contenido

Editá solo `src/data/event.json`:

- `honoree` — nombre de la cumpleañera
- `eventDate` — ISO (`2026-11-07T21:00:00-03:00`)
- `party` — salón y maps
- `gifts.alias` — alias real
- textos de urna, dress code y RSVP

## Build

```bash
npm run build
npm run preview
```

En este repo, un push a `main` publica la LP en **https://jesiyjavier.com.ar/xv/** (GitHub Pages).

`playlist.url` en `event.json` es el link de una playlist de Spotify (opcional). Los pedidos de temas llegan al mail de RSVP.

## RSVP

Las confirmaciones se envían por mail a `rsvp.email` en `event.json` (hoy `cjespelet@gmail.com`).

La primera vez, FormSubmit manda un mail de activación a esa casilla: hay que tocar **Activate Form**. Después cada RSVP llega ahí. Si no aparece, mirá spam.
