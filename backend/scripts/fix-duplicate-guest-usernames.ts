/**
 * Ejecutar ANTES de `npx prisma db push` si tenés usernames duplicados en Guest.
 *
 *   npx tsx scripts/fix-duplicate-guest-usernames.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugBase(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20);
}

async function main() {
  const rows = await prisma.$queryRaw<{ username: string }[]>`
    SELECT "username" FROM "Guest"
    WHERE "username" IS NOT NULL
    GROUP BY "username"
    HAVING COUNT(*) > 1
  `;

  if (rows.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No hay usernames duplicados (no nulos). Podés correr npx prisma db push');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('Corrigiendo duplicados:', rows.map((r) => r.username).join(', '));

  for (const { username } of rows) {
    const guests = await prisma.guest.findMany({
      where: { username },
      orderBy: { createdAt: 'asc' },
    });
    // El primero se queda; al resto les asignamos username1, username2, ...
    for (let i = 1; i < guests.length; i++) {
      const g = guests[i];
      let candidate = `${username}${i}`;
      let n = i;
      while (
        await prisma.guest.findFirst({
          where: { username: candidate, id: { not: g.id } },
        })
      ) {
        n += 1;
        candidate = `${username}${n}`;
      }
      await prisma.guest.update({
        where: { id: g.id },
        data: { username: candidate },
      });
      // eslint-disable-next-line no-console
      console.log(`  ${g.id} -> ${candidate}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log('Listo. Ahora: npx prisma db push');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
