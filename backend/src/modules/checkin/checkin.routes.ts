import { Router } from 'express';
import { prisma } from '../../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';

export const checkinRouter = Router();

// Check-in desde lector QR en la puerta (operado por personal)
checkinRouter.post('/', async (req, res) => {
  const { qr_code } = req.body as { qr_code?: string };
  if (!qr_code) {
    return res.status(400).json({ error: 'qr_code is required' });
  }

  const guest = await prisma.guest.findUnique({
    where: { qrCode: qr_code },
  });

  if (!guest) {
    return res.status(404).json({ error: 'Guest not found' });
  }

  if (guest.checkedIn) {
    return res.json({
      success: true,
      alreadyCheckedIn: true,
      guest,
    });
  }

  const updated = await prisma.guest.update({
    where: { id: guest.id },
    data: {
      checkedIn: true,
      checkedInTime: new Date(),
    },
  });

  return res.json({
    success: true,
    alreadyCheckedIn: false,
    guest: updated,
  });
});

// Check-in desde app del invitado leyendo QR general de la boda
checkinRouter.post('/from-guest', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const { code } = req.body as { code?: string };
  const user = req.user;

  if (!user?.sub || !user?.weddingId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  // Aquí podríamos validar el código escaneado (por ahora solo comprobamos que exista)
  if (!code) {
    return res.status(400).json({ error: 'code is required' });
  }

  const guest = await prisma.guest.findUnique({
    where: { id: user.sub },
  });

  if (!guest || guest.weddingId !== user.weddingId) {
    return res.status(404).json({ error: 'Guest not found' });
  }

  if (guest.checkedIn) {
    return res.json({
      success: true,
      guest,
      alreadyCheckedIn: true,
    });
  }

  const updated = await prisma.guest.update({
    where: { id: guest.id },
    data: {
      checkedIn: true,
      checkedInTime: new Date(),
    },
  });

  return res.json({
    success: true,
    guest: updated,
    alreadyCheckedIn: false,
  });
});

// Estado de check-in para el invitado actual
checkinRouter.get('/status', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user?.sub || !user?.weddingId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const guest = await prisma.guest.findUnique({
    where: { id: user.sub },
    select: { checkedIn: true, checkedInTime: true },
  });

  if (!guest) {
    return res.status(404).json({ error: 'Guest not found' });
  }

  return res.json({
    checkedIn: guest.checkedIn,
    checkedInTime: guest.checkedInTime,
  });
});

