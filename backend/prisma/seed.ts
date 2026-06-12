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

  // Example wedding
  const wedding = await prisma.wedding.upsert({
    where: { slug: 'demo-wedding' },
    update: {},
    create: {
      slug: 'demo-wedding',
      brideName: 'Alice',
      groomName: 'Bob',
      date: new Date(),
      time: '17:00',
      location: 'Demo Venue',
      description: 'Demo wedding for development',
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

