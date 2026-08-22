import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const drinks = await prisma.barDrink.findMany({ orderBy: { position: 'asc' } });
console.log(`Bar drinks count: ${drinks.length}`);
for (const drink of drinks) {
  console.log(`${drink.position}. ${drink.name} (${drink.glassType})`);
}

await prisma.$disconnect();
