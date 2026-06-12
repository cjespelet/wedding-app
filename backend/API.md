# Wedding App Backend API (Base)

Base URL: `/api`

## Auth

- **POST** `/auth/login` – admin login with email/password.
- **POST** `/auth/invitation` – guest login using invitation code + name.

## Wedding

- **GET** `/wedding/:slug` – public wedding info (story, instructions, timeline).
- **GET** `/wedding` – admin gets own wedding config (JWT required).
- **PUT** `/wedding` – admin updates wedding config (JWT required).

## RSVP

- **POST** `/rsvp` – guest submits RSVP.
- **GET** `/rsvp/stats` – admin RSVP stats and guest counts.

## Gallery

- **GET** `/gallery/:weddingId` – list approved photos for a wedding.
- **POST** `/gallery/upload` – photographer uploads photos (multipart `photos[]`, máx. 20, 5MB c/u, JPG/PNG/WebP). Las imágenes se suben a **Cloudinary**; la API guarda URLs públicas (`https://res.cloudinary.com/...`).
- **POST** `/gallery/upload-guest` – invitado sube fotos (multipart `photos[]`, máx. 5).

## Upload (genérico)

- **POST** `/upload` – una imagen, campo `image` (multipart). Respuesta: `{ "url": "<secure_url>" }`. Requiere JWT (invitado, fotógrafo o admin).
- **POST** `/upload/multiple` – varias imágenes, campo `images` (máx. 10). Respuesta: `{ "urls": ["..."] }`.

Variables de entorno: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Carpeta en Cloudinary: `bodas/{weddingId}`.

## Fotos (feed social, invitado JWT)

- **GET** `/photos?page=0&limit=15&mine=1` — feed de la boda; `mine=1` filtra “mis fotos” (subidas por el invitado). También `userId=<guestId>` para filtrar por otro invitado (misma boda).
- **POST** `/photos/:photoId/like` — toggle like (un usuario = un like por foto).
- **GET** `/photos/:photoId/likes` — lista `{ users: [{ username, fullName }] }`.
- **GET** `/photos/:photoId/comments?page=0` — comentarios paginados.

## Comentarios

- **POST** `/comments` — body JSON `{ "photoId", "content" }` (máx. 500 caracteres).
- **POST** `/comments/:commentId/like` — toggle like en comentario.

## DJ

- **POST** `/dj/request` – guest creates song request.
- **POST** `/dj/vote/:id` – guest upvotes a song.
- **GET** `/dj/requests` – DJ/admin list requests sorted by vote count.
- **POST** `/dj/played/:id` – DJ marks a song as played.

## Guestbook

- **GET** `/guestbook/:weddingId` – list guestbook messages.
- **POST** `/guestbook` – guest posts a message.

## Admin

- **POST** `/admin/invitation-codes` – generate invitation codes.
- **GET** `/admin/guests` – list guests with latest RSVP.
- **GET** `/admin/photos` – list photos for moderation.
- **PATCH** `/admin/photos/:id` – approve/highlight photo.
- **DELETE** `/admin/photos/:id` – delete photo.
- **GET** `/admin/analytics` – wedding analytics (guests, song requests, photos).

