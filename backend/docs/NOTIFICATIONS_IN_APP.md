# Notificaciones in-app (galería)

## Modelo

Tabla `guest_notifications` (`GuestNotification`): eventos para el invitado destinatario (`guestId`), con tipo `PHOTO_LIKE`, `PHOTO_COMMENT` o `COMMENT_LIKE`, actor (`actorId`), y opcionalmente `photoId` / `commentId`.

## Migración

```bash
cd backend
npx prisma db push
npx prisma generate
```

Si `prisma generate` falla por bloqueo de archivo en Windows, cerrá el IDE/terminal que use el motor y reintentá.

## API (invitado, JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notifications/unread-count` | `{ count }` |
| GET | `/api/notifications?page=0&limit=30` | Lista + `unreadCount` |
| POST | `/api/notifications/read-all` | Marcar todas leídas |
| POST | `/api/notifications/:id/read` | Marcar una leída |

## Frontend

- `NotificationService` + componente `app-notification-bell` (dashboard y galería).
- Polling del feed en galería cada ~18 s para actualizar likes/comentarios sin recargar.
- Polling de contador no leído cada ~20 s en la campanita.

No incluye push FCM (segundo plano); solo actividad con la app abierta o al volver (evento `resume` en nativo).
