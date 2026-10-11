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

## URL pública

Este sitio se publica en un repo aparte, **no** en jesiyjavier.com.ar:

**https://cjespelet.github.io/xv-delfi/**

## Contenido

Editá solo `src/data/event.json`:

- `honoree` — nombre de la cumpleañera
- `eventDate` — ISO (`2026-11-07T21:00:00-03:00`)
- `party` — salón y maps
- `gifts.alias` — alias real
- `playlist.url` — link de la playlist de Spotify
- `playlist.api` — URL del worker (cuando lo despliegues)
- textos de urna, dress code y RSVP

## Spotify (como SansoniFest)

La página es estática: el Client Secret **no** puede ir en el HTML. El “Pedir” suma el tema a **tu** playlist a través de un Worker gratis.

1. En Spotify, creá una playlist (ej. `XV Delfi`) y copiá el link. Pegalo en `playlist.url`.
2. En [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) creá una app.
3. En **Redirect URIs** agregá exactamente: `http://127.0.0.1:8888/callback`
4. Copiá Client ID y Client Secret.
5. En esta carpeta:

```bash
npm run spotify:auth
```

Iniciá sesión con **tu** cuenta de Spotify (la dueña de la playlist). La terminal imprime un refresh token.

6. En `spotify-api/wrangler.toml` pegá el ID de la playlist (la parte después de `/playlist/`).
7. Deploy del worker:

```bash
cd spotify-api
npx wrangler login
npx wrangler secret put SPOTIFY_CLIENT_ID
npx wrangler secret put SPOTIFY_CLIENT_SECRET
npx wrangler secret put SPOTIFY_REFRESH_TOKEN
npx wrangler deploy
```

8. Pegá la URL `https://….workers.dev` en `playlist.api` de `event.json`.

Hasta que exista `playlist.api`, el buscador funciona igual y los pedidos llegan al mail de RSVP.

## RSVP

Las confirmaciones se envían por mail a `rsvp.email` en `event.json` (hoy `cjespelet@gmail.com`).

La primera vez en una URL nueva, FormSubmit manda un mail de activación: hay que tocar **Activate Form**. Después cada RSVP llega ahí. Si no aparece, mirá spam.

## Build

```bash
npm run build
npm run preview
```
