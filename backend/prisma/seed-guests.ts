import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

const GUESTS = [
  { fullName: 'Flia Javier Espelet', adultsCount: 3, minorsCount: 1 },
  { fullName: 'Marta', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Flia Luciana', adultsCount: 2, minorsCount: 3 },
  { fullName: 'Flia Soledad', adultsCount: 2, minorsCount: 3 },
  { fullName: 'Flia Ariel', adultsCount: 5, minorsCount: 1 },
  { fullName: 'Maria Rosa', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Flia Montes', adultsCount: 2, minorsCount: 1 },
  { fullName: 'Flia Bujan', adultsCount: 2, minorsCount: 2 },
  { fullName: 'Flia Yoha', adultsCount: 2, minorsCount: 1 },
  { fullName: 'Enzo y Cintia', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Flia Sami - Gus', adultsCount: 2, minorsCount: 2 },
  { fullName: 'Flia Gaby - Fede', adultsCount: 2, minorsCount: 2 },
  { fullName: 'Flia Belsito', adultsCount: 2, minorsCount: 2 },
  { fullName: 'Flia Jose', adultsCount: 2, minorsCount: 1 },
  { fullName: 'Flia Corvalan', adultsCount: 2, minorsCount: 1 },
  { fullName: 'Flia Baiza', adultsCount: 2, minorsCount: 2 },
  { fullName: 'Flia Rocha', adultsCount: 2, minorsCount: 1 },
  { fullName: 'Mati y Jacke', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Flia Cordero', adultsCount: 2, minorsCount: 1 },
  { fullName: 'Flia Balcarse', adultsCount: 2, minorsCount: 1 },
  { fullName: 'Peco', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Mauro Penone y flia', adultsCount: 2, minorsCount: 1 },
  { fullName: 'Ramiro y flia', adultsCount: 2, minorsCount: 2 },
  { fullName: 'Pala', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Mauro', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Mariano y Magda', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Pepe y Paola', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Fer y Paola', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Coma y Fernanda', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Gusta y Cintia', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Landu', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Daniel y Andrea', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Corva', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Ale y Pareja', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Anahi y Pareja', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Flia Cuesta', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Flia Mariana', adultsCount: 2, minorsCount: 1 },
  { fullName: 'Andrea Dogna', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Jimena y Gustavo', adultsCount: 2, minorsCount: 0 },
  { fullName: 'karina', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Marcelina', adultsCount: 1, minorsCount: 1 },
  { fullName: 'Daiana', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Flia Marina', adultsCount: 2, minorsCount: 1 },
  { fullName: 'Mica y Adrian', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Flia Bianca', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Laurita Movilio', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Maria Urtiaga', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Nacha', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Claudio y Mari', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Mati y Natalia', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Jorge', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Belen y Jose', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Caro', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Zulma y Tito', adultsCount: 2, minorsCount: 0 },
  { fullName: 'Anabel', adultsCount: 1, minorsCount: 0 },
  { fullName: 'Leti y Martin', adultsCount: 2, minorsCount: 0 },
];

function random4Digit(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function main() {
  const wedding = await prisma.wedding.findFirst({ where: { slug: 'demo-wedding' } });
  if (!wedding) {
    throw new Error('No existe la boda demo-wedding. Ejecuta antes: npm run seed');
  }

  for (const g of GUESTS) {
    await prisma.guest.create({
      data: {
        weddingId: wedding.id,
        fullName: g.fullName,
        adultsCount: g.adultsCount,
        minorsCount: g.minorsCount,
        qrCode: crypto.randomUUID(),
        accessCode: random4Digit(),
      },
    });
  }

  console.log(`Creados ${GUESTS.length} invitados para la boda "${wedding.slug}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
