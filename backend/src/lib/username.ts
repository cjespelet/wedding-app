import type { PrismaClient } from '@prisma/client';

/**
 * Normaliza un nombre a handle tipo Instagram: minúsculas, sin espacios, sin acentos.
 */
export function slugifyName(name: string): string {
  const s = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);
  return s || 'invitado';
}

/**
 * Genera username único global (Guest.username es @unique): base, base1, base2, ...
 */
export async function generateUniqueUsername(prisma: PrismaClient, fromName: string): Promise<string> {
  let base = slugifyName(fromName);
  if (!base) base = 'invitado';

  let candidate = base;
  let n = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.guest.findFirst({
      where: { username: candidate },
      select: { id: true },
    });
    if (!exists) {
      return candidate;
    }
    n += 1;
    candidate = `${base}${n}`;
  }
}
