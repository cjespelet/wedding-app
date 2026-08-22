import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const fixes: Array<{ name: string; description: string }> = [
  { name: 'Fernet con Coca-Cola', description: 'Clásico argentino' },
  { name: 'Gancia batida', description: 'Gancia, Sprite y limón fresco' },
  { name: 'Vodka con naranja', description: 'Vodka y jugo de naranja' },
  { name: 'Gin Tonic', description: 'Gin, agua tónica y rodaja de limón' },
  { name: 'Aperol Spritz', description: 'Aperol con pomelo o soda' },
  { name: 'Caipirinha', description: 'Cachaça, lima fresca y azúcar' },
  { name: 'Caipiroska', description: 'Vodka, lima fresca y azúcar' },
];

for (const fix of fixes) {
  await prisma.barDrink.updateMany({
    where: { name: fix.name },
    data: { description: fix.description },
  });
}

console.log('Bar drink descriptions updated with proper accents.');
await prisma.$disconnect();
