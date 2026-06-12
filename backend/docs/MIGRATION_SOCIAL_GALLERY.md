# Migración: galería social (likes, comentarios, username único)

Después de actualizar el código:

1. Si `db push` falla o avisa por **username duplicado**, corré antes:

```bash
cd backend
npx tsx scripts/fix-duplicate-guest-usernames.ts
```

2. Aplicá el esquema a la base de datos:

```bash
cd backend
npx prisma db push
npx prisma generate
```

Si Prisma solo muestra el aviso genérico de “data loss” y **no** tenés duplicados, podés usar `npx prisma db push --accept-data-loss` (revisá antes el diff del esquema).

3. Los **likes** previos al cambio estaban solo en el contador `Photo.likes`. El nuevo sistema usa la tabla `photo_likes` y **sincroniza** `Photo.likes` con el conteo real al dar o quitar like.

4. Invitados **sin** `username` pueden seguir usando flujos por código de invitación; para login con usuario/contraseña hace falta `username` (registro admin o `/auth/register`).
