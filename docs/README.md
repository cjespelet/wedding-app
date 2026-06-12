# Documentación general del proyecto Wedding App

Este monorepo contiene la base completa de un **sistema de acompañamiento para bodas** (Wedding Event Companion App): backend en Node/Express + PostgreSQL y frontend móvil/web con Angular + Ionic.

## 1. Estructura del repositorio

En la raíz del proyecto:

- `backend/` – API REST en Node.js + Express + TypeScript + PostgreSQL (Prisma), con sistema de roles y gestión de imágenes.
- `frontend/` – Código base para la app Angular + Ionic (servicios, páginas y rutas principales).
- `docs/` – Documentación del proyecto (este archivo y futuros documentos).
- `SPEC.md` – Especificación funcional original (en inglés) con todos los requisitos.

### 1.1. Backend

Dentro de `backend/`:

- `src/`
  - `index.ts` / `server.ts` – arranque del servidor Express y registro de middlewares.
  - `config/env.ts` – lectura de variables de entorno (`DATABASE_URL`, `JWT_SECRET`, etc.).
  - `db/prisma.ts` – cliente de Prisma.
  - `web/api-router.ts` – router principal `/api` que agrupa todos los módulos.
  - `middleware/auth.ts` – middleware de autenticación JWT y control de roles.
  - `modules/`
    - `auth/` – login de admin (`/auth/login`) y login por código de invitación (`/auth/invitation`).
    - `wedding/` – configuración y datos públicos de la boda (`/wedding`).
    - `rsvp/` – confirmación de asistencia e informes (`/rsvp`).
    - `gallery/` – subida y listado de fotos con procesamiento de imágenes (`/gallery`).
    - `dj/` – peticiones y votos de canciones (`/dj`).
    - `guestbook/` – libro de visitas (`/guestbook`).
    - `admin/` – funciones de panel admin: invitados, fotos, analíticas, códigos (`/admin`).
- `prisma/`
  - `schema.prisma` – definición del modelo de datos (usuarios, roles, boda, invitados, fotos, canciones, guestbook, etc.).
  - `seed.ts` – semilla de datos para desarrollo (roles, super admin, boda demo).
- `API.md` – resumen de los endpoints principales.
- `README.md` – guía de instalación y ejecución del backend.

### 1.2. Frontend

Dentro de `frontend/` (código base que debes integrar en una app Ionic Angular generada con el CLI):

- `README.md` – indica cómo crear la app Ionic (`npm create ionic@latest`) y cómo integrar este código.
- `src/app/`
  - `app.routes.ts` – rutas principales (guest, admin, auth).
  - `core/`
    - `services/` – servicios Angular para consumir la API:
      - `auth.service.ts` – login admin + login por código de invitación, token JWT en localStorage.
      - `wedding.service.ts` – lectura y edición de configuración de la boda.
      - `rsvp.service.ts` – envío de RSVP y estadísticas.
      - `gallery.service.ts` – galería de fotos y subida de imágenes (fotógrafo).
      - `dj.service.ts` – peticiones y votos de canciones, panel DJ.
      - `guestbook.service.ts` – libro de visitas.
      - `admin.service.ts` – invitados y analíticas para el panel de admin.
    - `auth-token.interceptor.ts` – añade automáticamente el header `Authorization: Bearer <token>`.
    - `auth.guard.ts` – protege rutas que requieren estar autenticado.
  - `pages/`
    - `auth/`
      - `login/` – pantalla de login para admin (email/contraseña).
      - `invitation/` – pantalla de login para invitados con código de invitación.
    - `guest/`
      - `home/` – pantalla principal para invitados con presentación de la boda (nombres, fecha, lugar, historia, instrucciones).
      - `rsvp/` – formulario de confirmación de asistencia.
      - `gallery/` – galería de fotos con miniaturas cuadradas.
      - `dj-requests/` – envío de canciones y visualización de canciones “trending”.
      - `guestbook/` – libro de visitas (añadir y leer mensajes).
    - `admin/`
      - `dashboard/` – resumen con métricas (confirmados, totales, fotos, canciones, últimos RSVP).
      - `wedding-settings/` – formulario para configurar datos de la boda (nombres, fecha, hora, lugar, historia, instrucciones).
      - `guests/` – listado filtrable de invitados (por familia y por estado de asistencia).
      - `photos/` – moderación de fotos (aprobar, destacar, borrar) sobre la galería.

> Nota: el frontend está pensado para mezclarse dentro de un proyecto Ionic Angular generado con el CLI. Este repo aporta la estructura, servicios y páginas, no el bootstrap completo de Ionic.

## 2. Roles y paneles

El sistema define varios roles de usuario, alineados con la especificación original:

- **Super Admin** – gestión global (pensado más para desarrollo o panel maestro).
- **Wedding Admin (la pareja)** – administra la boda específica:
  - Configuración de boda (datos básicos, historia, instrucciones, timeline).
  - Gestión de invitados y revisión de RSVP.
  - Moderación de fotos.
  - Visualización de analíticas (asistentes confirmados, total invitados, uso de funcionalidades).
- **Guest (invitado)** – accede con código de invitación:
  - Confirma asistencia (RSVP).
  - Consulta información de la boda.
  - Ve la galería de fotos, pide canciones al DJ y deja mensajes en el guestbook.
- **DJ** – ve peticiones de canciones y su ranking de votos; marca canciones como reproducidas.
- **Photographer** – sube fotos de forma rápida, que se procesan y encuadran automáticamente.

Cada panel (Admin, DJ, Photographer, Guest) tiene su propio conjunto de pantallas en el frontend y endpoints dedicados en el backend.

## 3. Sistema de imágenes (Cloudinary)

Las fotos se suben a **Cloudinary** (carpeta `bodas/{weddingId}`). El backend usa **multer** solo en memoria y guarda en base de datos las URLs públicas (`originalUrl`, `largeUrl`, `mediumUrl`, `squareUrl`) generadas con transformaciones on-the-fly (límite de tamaño, recorte cuadrado con `gravity: auto`, etc.). No se guardan archivos en disco en el servidor.

Variables de entorno: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

## 4. Flujos principales

### 4.1. Creación y configuración de boda (Admin)

1. El admin (o super admin) inicia sesión en `/api/auth/login` desde la pantalla `AuthLoginPage`.
2. Se configura la boda en el panel:
   - `AdminWeddingSettingsPage` llama a `WeddingService.getOwnWedding()` y `updateWedding()`.
3. Desde el panel admin, se pueden generar códigos de invitación y gestionar invitados (pantalla `AdminGuestsPage`):
   - Los códigos se crean desde el backend (`POST /api/admin/invitation-codes`).

### 4.2. Invitados y RSVP

1. Un invitado recibe un código y lo introduce en `AuthInvitationPage`.
2. El backend valida el código y crea/actualiza el invitado, devolviendo un JWT con rol `guest`.
3. El invitado puede:
   - Confirmar asistencia en `GuestRsvpPage` (`POST /api/rsvp`).
   - Ver su estado reflejado para el admin en `/api/admin/guests` y `/api/rsvp/stats`.

### 4.3. Galería de fotos

1. El fotógrafo sube fotos desde su panel (en el futuro `PhotographerUploaderPage`) usando `GalleryService.uploadPhotos()`.
2. El backend procesa las imágenes y las guarda en distintas resoluciones, aplicando el encuadre inteligente para la versión cuadrada.
3. El admin puede moderar las fotos en `AdminPhotosPage`:
   - Aprobar (`PATCH /api/admin/photos/:id` con `approved: true`).
   - Destacar (`highlighted: true/false`).
   - Eliminar (`DELETE /api/admin/photos/:id`).
4. Los invitados ven la galería aprobada en `GuestGalleryPage` (`GET /api/gallery/:weddingId`). 

### 4.4. Peticiones al DJ

1. Los invitados envían canciones desde `GuestDjRequestsPage` (`POST /api/dj/request`).  
2. Otros invitados pueden votar canciones (`POST /api/dj/vote/:id`).  
3. El DJ ve la lista ordenada por votos y marca canciones como reproducidas (`/api/dj/requests`, `/api/dj/played/:id`).  

### 4.5. Guestbook

1. Los invitados dejan mensajes en `GuestGuestbookPage` (`POST /api/guestbook`).  
2. Todos los mensajes se listan en la misma página (`GET /api/guestbook/:weddingId`).  

## 5. Cómo usar el proyecto (resumen rápido)

### 5.1. Backend

1. Crear archivo `.env` en `backend/` con al menos:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/wedding_app"
   JWT_SECRET="cambia-esta-clave"
   CLOUDINARY_CLOUD_NAME="tu_cloud"
   CLOUDINARY_API_KEY="tu_key"
   CLOUDINARY_API_SECRET="tu_secret"
   PORT=4000
   ```

2. Instalar dependencias y aplicar migraciones:

   ```bash
   cd backend
   npm install
   npx prisma migrate dev --name init
   npx prisma generate
   npm run seed   # opcional, para crear roles, admin y boda demo
   npm run dev
   ```

3. El API estará disponible en `http://localhost:4000/api`.

### 5.2. Frontend

1. Generar una app Ionic Angular (si aún no existe) dentro de `frontend/`:

   ```bash
   cd frontend
   npm create ionic@latest wedding-frontend -- --type=angular
   ```

2. Copiar/mezclar el contenido de `frontend/src/app` de este repo dentro de `wedding-frontend/src/app`:
   - `core/` (servicios, interceptor, guard).
   - `pages/` (guest, admin, auth).
   - `app.routes.ts` (o fusionar con las rutas existentes).

3. Configurar `environment.ts` en el proyecto Ionic para apuntar al backend:

   ```ts
   export const environment = {
     production: false,
     apiBaseUrl: 'http://localhost:4000/api',
   };
   ```

4. Registrar las rutas y el interceptor en el `bootstrapApplication` (o módulo principal) según la plantilla generada por Ionic.

5. Ejecutar la app:

   ```bash
   npm install
   npm run start   # o ionic serve, según el package.json generado
   ```

Con esto tendrás el backend y el frontend comunicándose, listo para ir puliendo **pantalla por pantalla** (diseño, textos, validaciones, animaciones, etc.) sobre una base ya funcional y alineada con la especificación original.

