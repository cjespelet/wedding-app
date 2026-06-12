import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../../db/prisma.js';
import { deleteCloudinaryImageByUrl } from '../../lib/cloudinary-images.js';
import { generateUniqueUsername } from '../../lib/username.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';

export const adminRouter = Router();

// Generate invitation codes
adminRouter.post(
  '/invitation-codes',
  requireAuth(['super_admin', 'wedding_admin']),
  async (req: AuthenticatedRequest, res) => {
    const { count } = req.body as { count?: number };
    const weddingId = req.user?.weddingId;
    if (!weddingId) {
      return res.status(400).json({ error: 'No weddingId on token' });
    }

    const howMany = count && count > 0 ? count : 1;
    const codes = [];

    for (let i = 0; i < howMany; i += 1) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const created = await prisma.invitationCode.create({
        data: {
          code,
          weddingId,
        },
      });
      codes.push(created);
    }

    return res.status(201).json(codes);
  },
);

// List guests with RSVP info (admin)
adminRouter.get('/guests', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const guests = await prisma.guest.findMany({
    where: { weddingId },
    include: {
      rsvps: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return res.json(guests);
});

// Public guest groups for mobile app (no auth, single-wedding setup)
adminRouter.get('/guests-public', async (_req, res) => {
  const guests = await prisma.guest.findMany({
    orderBy: { fullName: 'asc' },
  });

  const simplified = guests.map((g) => ({
    id: g.id,
    fullName: g.fullName,
    familyGroup: g.familyGroup,
    username: g.username,
  }));

  return res.json(simplified);
});

function random4DigitCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Create guest with QR code
adminRouter.post('/guests', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const {
    fullName,
    name,
    last_name,
    email,
    group_name,
    familyGroup,
    adultsCount,
    minorsCount,
    username,
    accessCode,
    canSharePhotos,
  } = req.body as {
    fullName?: string;
    name?: string;
    last_name?: string;
    email?: string;
    group_name?: string;
    familyGroup?: string;
    adultsCount?: number;
    minorsCount?: number;
    username?: string;
    accessCode?: string;
    canSharePhotos?: boolean;
  };

  const resolvedName = fullName ?? (name ? (last_name ? `${name} ${last_name}` : name) : undefined);
  if (!resolvedName?.trim()) {
    return res.status(400).json({ error: 'Nombre is required' });
  }

  const qrCode = crypto.randomUUID();
  const code = accessCode?.replace(/\D/g, '').slice(0, 4) || random4DigitCode();

  const resolvedUsername =
    username?.trim() || (await generateUniqueUsername(prisma, resolvedName.trim()));

  const guest = await prisma.guest.create({
    data: {
      fullName: resolvedName.trim(),
      familyGroup: familyGroup ?? group_name ?? undefined,
      email: email || undefined,
      adultsCount: adultsCount != null && adultsCount >= 0 ? adultsCount : 1,
      minorsCount: minorsCount != null && minorsCount >= 0 ? minorsCount : 0,
      username: resolvedUsername,
      accessCode: code,
      weddingId,
      qrCode,
    },
  });

  return res.status(201).json(guest);
});

// Update guest
adminRouter.put('/guests/:id', requireAuth(['super_admin', 'wedding_admin']), async (req, res) => {
  const { id } = req.params;
  const {
    fullName,
    name,
    last_name,
    email,
    group_name,
    familyGroup,
    adultsCount,
    minorsCount,
    username,
    accessCode,
    canSharePhotos,
  } = req.body as {
    fullName?: string;
    name?: string;
    last_name?: string;
    email?: string;
    group_name?: string;
    familyGroup?: string;
    adultsCount?: number;
    minorsCount?: number;
    username?: string;
    accessCode?: string;
    canSharePhotos?: boolean;
  };

  const resolvedName = fullName ?? (name ? (last_name ? `${name} ${last_name}` : name) : undefined);
  const resolvedGroup = familyGroup !== undefined ? familyGroup : group_name;
  const code = accessCode !== undefined ? accessCode.replace(/\D/g, '').slice(0, 4) || null : undefined;

  const data: Record<string, unknown> = {};
  if (resolvedName != null) data.fullName = resolvedName.trim();
  if (resolvedGroup !== undefined) data.familyGroup = resolvedGroup || null;
  if (email !== undefined) data.email = email || null;
  if (adultsCount != null && adultsCount >= 0) data.adultsCount = adultsCount;
  if (minorsCount != null && minorsCount >= 0) data.minorsCount = minorsCount;
  if (username !== undefined) data.username = username?.trim() || null;
  if (code !== undefined) data.accessCode = code;
  if (canSharePhotos !== undefined) data.canSharePhotos = canSharePhotos;

  const updated = await prisma.guest.update({
    where: { id },
    data,
  });

  return res.json(updated);
});

// Delete guest
adminRouter.delete('/guests/:id', requireAuth(['super_admin', 'wedding_admin']), async (req, res) => {
  const { id } = req.params;
  await prisma.guest.delete({ where: { id } });
  return res.status(204).end();
});

// Photo moderation list
adminRouter.get('/photos', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const photos = await prisma.photo.findMany({
    where: { weddingId },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(photos);
});

// Approve / highlight / delete photo
adminRouter.patch('/photos/:id', requireAuth(['super_admin', 'wedding_admin']), async (req, res) => {
  const { id } = req.params;
  const { approved, highlighted } = req.body as { approved?: boolean; highlighted?: boolean };

  const updated = await prisma.photo.update({
    where: { id },
    data: {
      approved,
      highlighted,
    },
  });

  return res.json(updated);
});

adminRouter.delete(
  '/photos/:id',
  requireAuth(['super_admin', 'wedding_admin']),
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const weddingId = req.user?.weddingId;
    if (!weddingId) {
      return res.status(400).json({ error: 'No weddingId on token' });
    }

    const photo = await prisma.photo.findFirst({
      where: { id, weddingId },
    });

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    try {
      await deleteCloudinaryImageByUrl(photo.originalUrl);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Cloudinary destroy failed', err);
      return res.status(500).json({ error: 'No se pudo eliminar la imagen en el almacenamiento' });
    }

    await prisma.photo.delete({ where: { id } });
    return res.status(204).end();
  },
);

// Basic analytics
adminRouter.get('/analytics', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const [confirmedGuests, totalGuests, songRequests, photos] = await Promise.all([
    prisma.rsvp.aggregate({
      where: { weddingId, attending: true },
      _sum: { numberOfGuests: true },
    }),
    prisma.guest.count({ where: { weddingId } }),
    prisma.songRequest.count({ where: { weddingId } }),
    prisma.photo.count({ where: { weddingId } }),
  ]);

  return res.json({
    confirmedGuests: confirmedGuests._sum.numberOfGuests ?? 0,
    totalGuests,
    songRequests,
    photos,
  });
});

