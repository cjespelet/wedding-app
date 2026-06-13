import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import crypto from 'node:crypto';

import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { generateUniqueUsername, slugifyName } from '../../lib/username.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, username, password } = req.body as {
    email?: string;
    username?: string;
    password?: string;
  };
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  // Admin login via email
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, weddings: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const primaryWeddingId = user.weddings[0]?.id;

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role.name,
        weddingId: primaryWeddingId,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn },
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        weddingId: primaryWeddingId,
      },
    });
  }

  // Guest login via username + accessCode (4 dígitos usados como password en la app)
  if (!username) {
    return res.status(400).json({ error: 'Username is required for guest login' });
  }

  const guest = await prisma.guest.findFirst({
    where: { username },
  });

  // accessCode puede estar almacenado en texto plano (4 dígitos) o hasheado.
  let validGuest = false;
  if (guest && guest.accessCode) {
    // 1) Intentamos comparar como hash bcrypt
    try {
      validGuest = await bcrypt.compare(password, guest.accessCode);
    } catch {
      validGuest = false;
    }
    // 2) Si no coincide como hash, probamos comparación directa (modo compatibilidad)
    if (!validGuest && password === guest.accessCode) {
      validGuest = true;
    }
  }

  if (!guest || !validGuest) {
    return res.status(401).json({ error: 'Invalid guest credentials' });
  }

  const token = jwt.sign(
    {
      sub: guest.id,
      role: 'guest',
      weddingId: guest.weddingId,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

  return res.json({
    token,
    guest: {
      id: guest.id,
      name: guest.fullName,
      username: guest.username,
      weddingId: guest.weddingId,
    },
  });
});

authRouter.post('/invitation', async (req, res) => {
  const { code, name } = req.body as { code?: string; name?: string };
  if (!code || !name) {
    return res.status(400).json({ error: 'Code and name are required' });
  }

  const invitation = await prisma.invitationCode.findUnique({
    where: { code },
    include: { wedding: true, guest: true },
  });

  if (!invitation || invitation.used) {
    return res.status(400).json({ error: 'Invalid or used invitation code' });
  }

  const guest =
    invitation.guest ??
    (await prisma.guest.create({
      data: {
        fullName: name,
        weddingId: invitation.weddingId,
        qrCode: crypto.randomUUID(),
        username: await generateUniqueUsername(prisma, name),
      },
    }));

  if (!invitation.used || !invitation.guestId) {
    await prisma.invitationCode.update({
      where: { id: invitation.id },
      data: {
        used: true,
        usedAt: new Date(),
        guestId: guest.id,
      },
    });
  }

  const token = jwt.sign(
    {
      sub: guest.id,
      role: 'guest',
      weddingId: invitation.weddingId,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

  return res.json({
    token,
    guest: {
      id: guest.id,
      name: guest.fullName,
      username: guest.username,
      weddingId: guest.weddingId,
    },
    wedding: {
      id: invitation.wedding.id,
      brideName: invitation.wedding.brideName,
      groomName: invitation.wedding.groomName,
      date: invitation.wedding.date,
      location: invitation.wedding.location,
    },
  });
});

// Vista previa de invitación personalizada (sin auth)
authRouter.get('/invite/:guestId', async (req, res) => {
  const { guestId } = req.params;

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: {
      id: true,
      fullName: true,
      familyGroup: true,
      username: true,
    },
  });

  if (!guest) {
    return res.status(404).json({ error: 'Invitación no encontrada' });
  }

  if (guest.username) {
    return res.status(409).json({
      error: 'Este invitado ya tiene cuenta registrada',
      registered: true,
      fullName: guest.fullName,
    });
  }

  return res.json({
    id: guest.id,
    fullName: guest.fullName,
    displayName: guest.familyGroup || guest.fullName,
  });
});

// Register guest credentials for existing guest (picked from admin list via groupId)
authRouter.post('/register', async (req, res) => {
  const { name, username: rawUsername, password, groupId } = req.body as {
    name?: string;
    username?: string;
    password?: string;
    groupId?: string;
  };

  if (!name || !password || !groupId) {
    return res.status(400).json({ error: 'name, password and groupId are required' });
  }

  const guest = await prisma.guest.findUnique({
    where: { id: groupId },
  });

  if (!guest) {
    return res.status(404).json({ error: 'Guest group not found' });
  }

  if (guest.username) {
    return res.status(409).json({ error: 'Este invitado ya tiene cuenta registrada' });
  }

  let username: string;
  if (rawUsername?.trim()) {
    username = slugifyName(rawUsername.trim());
    if (username.length < 2) {
      return res.status(400).json({ error: 'Username inválido' });
    }
    const existingWithUsername = await prisma.guest.findFirst({
      where: { username },
    });
    if (existingWithUsername && existingWithUsername.id !== guest.id) {
      return res.status(400).json({ error: 'Username already in use' });
    }
  } else {
    username = await generateUniqueUsername(prisma, name);
  }

  const hashedCode = await bcrypt.hash(password, 10);

  const updated = await prisma.guest.update({
    where: { id: guest.id },
    data: {
      fullName: name,
      username,
      accessCode: hashedCode,
    },
  });

  const token = jwt.sign(
    {
      sub: updated.id,
      role: 'guest',
      weddingId: updated.weddingId,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

  return res.status(201).json({
    token,
    user: {
      id: updated.id,
      name: updated.fullName,
      username: updated.username,
      role: 'guest',
      weddingId: updated.weddingId,
    },
  });
});

