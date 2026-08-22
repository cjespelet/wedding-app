import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const wedding = await prisma.wedding.findFirst({ orderBy: { createdAt: 'asc' } });
const drinks = await prisma.barDrink.findMany({ orderBy: { position: 'asc' } });
const admins = await prisma.user.findMany({
  where: { email: { in: ['admin@example.com', 'aesudo@wedding.com'] } },
  include: { weddings: { select: { id: true, slug: true } } },
});

console.log('Wedding:', wedding?.id, wedding?.slug);
console.log('Drinks weddingIds:', [...new Set(drinks.map((d) => d.weddingId))]);
console.log('Drinks count:', drinks.length);
for (const admin of admins) {
  console.log(`Admin ${admin.email} weddings:`, admin.weddings.map((w) => `${w.slug} (${w.id})`).join(', '));
}

await prisma.$disconnect();
