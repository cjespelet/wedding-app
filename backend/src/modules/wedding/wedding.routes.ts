import { Router } from 'express';
import { prisma } from '../../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';

export const weddingRouter = Router();

// Guest/Admin: get current wedding using token.weddingId
weddingRouter.get(
  '/current',
  requireAuth(['super_admin', 'wedding_admin', 'guest']),
  async (req: AuthenticatedRequest, res) => {
    const weddingId = req.user?.weddingId;
    if (!weddingId) {
      return res.status(400).json({ error: 'No weddingId on token' });
    }

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      include: {
        schedules: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    return res.json(wedding);
  },
);

// Get public wedding info by slug (optional, for shareable links)
weddingRouter.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const wedding = await prisma.wedding.findUnique({
    where: { slug },
    include: {
      schedules: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!wedding) {
    return res.status(404).json({ error: 'Wedding not found' });
  }

  return res.json(wedding);
});

// Admin: get own wedding by id
weddingRouter.get('/', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const wedding = await prisma.wedding.findUnique({
    where: { id: weddingId },
    include: {
      schedules: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!wedding) {
    return res.status(404).json({ error: 'Wedding not found' });
  }

  return res.json(wedding);
});

// Admin: update wedding configuration
weddingRouter.put('/', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const {
    brideName,
    groomName,
    date,
    time,
    location,
    description,
    story,
    instructions,
    allowPhotoSharing,
    maxSharesPerGuest,
  } = req.body as {
    brideName?: string;
    groomName?: string;
    date?: string;
    time?: string;
    location?: string;
    description?: string;
    story?: string;
    instructions?: string;
    allowPhotoSharing?: boolean;
    maxSharesPerGuest?: number;
  };

  const wedding = await prisma.wedding.update({
    where: { id: weddingId },
    data: {
      brideName,
      groomName,
      date: date ? new Date(date) : undefined,
      time,
      location,
      description,
      story,
      instructions,
      allowPhotoSharing,
      maxSharesPerGuest,
    },
  });

  return res.json(wedding);
});

