import { Router } from 'express';
import { prisma } from '../../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';

export const songsRouter = Router();

// Listar pedidos de tema del invitado actual
songsRouter.get('/my', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  const guestId = req.user?.sub;

  if (!weddingId || !guestId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const requests = await prisma.songRequest.findMany({
    where: { weddingId, guestId },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(requests);
});

// Crear un nuevo pedido de tema desde la app de invitados
songsRouter.post('/', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  const guestId = req.user?.sub;

  if (!weddingId || !guestId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const { title, artist, comment } = req.body as {
    title?: string;
    artist?: string;
    comment?: string | null;
  };

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  const created = await prisma.songRequest.create({
    data: {
      weddingId,
      guestId,
      title,
      artist: artist ?? '',
      comment: comment ?? null,
    },
  });

  return res.status(201).json(created);
});

