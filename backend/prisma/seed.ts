import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Roles
  const roles = ['super_admin', 'wedding_admin', 'guest', 'dj', 'photographer'];
  const roleRecords = await Promise.all(
    roles.map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const superAdminRole = roleRecords.find((r) => r.name === 'super_admin');
  if (!superAdminRole) {
    throw new Error('super_admin role not created');
  }

  // Super admin users for initial login
  const admins = [
    { email: 'admin@example.com', name: 'Super Admin', password: 'admin123' },
    { email: 'aesudo@wedding.com', name: 'Aesudo', password: '2345' },
  ];

  for (const admin of admins) {
    const passwordHash = await bcrypt.hash(admin.password, 10);
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        password: passwordHash,
        roleId: superAdminRole.id,
      },
      create: {
        email: admin.email,
        name: admin.name,
        password: passwordHash,
        roleId: superAdminRole.id,
      },
    });
  }

  // Wedding (slug demo-wedding kept for compatibility with existing data)
  const weddingData = {
    brideName: 'Jesica',
    groomName: 'Javier',
    date: new Date('2026-09-26T21:00:00.000Z'),
    time: '21:00',
    location: 'Sueño verde — Tandil',
    description: 'Celebración de la boda de Jesica y Javier',
    instructions:
      'https://www.google.com/maps/search/?api=1&query=Av.+Estrada,+B7000+Tandil,+Provincia+de+Buenos+Aires',
  };

  const wedding = await prisma.wedding.upsert({
    where: { slug: 'demo-wedding' },
    update: weddingData,
    create: {
      slug: 'demo-wedding',
      ...weddingData,
    },
  });

  // Link super admins to the demo wedding as admins
  await prisma.wedding.update({
    where: { id: wedding.id },
    data: {
      admins: {
        connect: admins.map((a) => ({ email: a.email })),
      },
    },
  });

  // DJ test user with access only to DJ screens in admin-web
  const djRole = roleRecords.find((r) => r.name === 'dj');
  if (djRole) {
    const djPasswordHash = await bcrypt.hash('dj1234', 10);
    await prisma.user.upsert({
      where: { email: 'dj@example.com' },
      update: {
        name: 'DJ',
        password: djPasswordHash,
        roleId: djRole.id,
      },
      create: {
        email: 'dj@example.com',
        name: 'DJ',
        password: djPasswordHash,
        roleId: djRole.id,
      },
    });

    await prisma.wedding.update({
      where: { id: wedding.id },
      data: {
        admins: {
          connect: [{ email: 'dj@example.com' }],
        },
      },
    });
  }

  console.log('Seeded roles, admin users, and wedding with id', wedding.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

