## Wedding App Frontend (Angular + Ionic)

This folder contains the **structure and example code** for the Wedding Event Companion App frontend, built with **Angular (standalone components)** and **Ionic**.

You can use the official Ionic CLI to scaffold the base app, then drop these services/pages into it.

### 1. Create an Ionic Angular app

From the `frontend` folder:

```bash
cd frontend
npm create ionic@latest wedding-app-frontend -- --type=angular
```

Or, if you already have the Ionic CLI installed:

```bash
ionic start wedding-app-frontend tabs --type=angular
```

Then move or merge the `src/app` structure from this folder into the generated app.

### 2. Configure the API base URL

Create an `environment.ts` (and `environment.prod.ts` as needed) and expose `apiBaseUrl` pointing to the backend:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:4000/api',
};
```

Update the services below to import from your environment file.

### 3. App structure (proposed)

- `core/services/auth.service.ts` – handles JWT login (admin + guest invitation), token storage.
- `core/services/wedding.service.ts` – loads wedding info, timeline, story, configuration.
- `core/services/rsvp.service.ts` – submit RSVP and fetch RSVP stats.
- `core/services/gallery.service.ts` – gallery listing and upload (for photographer panel).
- `core/services/dj.service.ts` – DJ requests, votes, and dashboard listing.
- `core/services/guestbook.service.ts` – guestbook messages list + post.
- `pages/guest/*` – guest-facing pages (RSVP, gallery, DJ requests, guestbook, profile).
- `pages/admin/*` – admin dashboard pages (wedding settings, guests, photos, analytics).
- `pages/dj/*` – DJ song request dashboard.
- `pages/photographer/*` – photographer uploader page.

Use Angular standalone components (`standalone: true`) with Ionic UI components for all pages.

