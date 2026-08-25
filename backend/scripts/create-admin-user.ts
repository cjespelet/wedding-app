import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim() || 'admin@boda.com';
  const password = process.env.ADMIN_PASSWORD?.trim() || '123456';

  const role = await prisma.role.findUnique({ where: { name: 'super_admin' } });
  if (!role) throw new Error('super_admin role missing');

  const wedding = await prisma.wedding.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!wedding) throw new Error('No wedding found — run npm run seed first');

  const existing = await prisma.user.findUnique({ where: { email } });
  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: { name: 'Admin Boda', roleId: role.id },
      })
    : await prisma.user.create({
        data: {
          email,
          name: 'Admin Boda',
          password: await bcrypt.hash(password, 10),
          roleId: role.id,
        },
      });

  await prisma.wedding.update({
    where: { id: wedding.id },
    data: { admins: { connect: { id: user.id } } },
  });

  console.log(
    existing
      ? `Admin ya existía (${email}); vinculado a boda "${wedding.slug}"`
      : `Admin creado: ${email} → boda "${wedding.slug}" (${wedding.id})`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
