import { Router } from 'express';
import { prisma } from '../../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';

export const guestbookRouter = Router();

// Public/guest: list messages
guestbookRouter.get('/:weddingId', async (req, res) => {
  const { weddingId } = req.params;
  const messages = await prisma.guestbookMessage.findMany({
    where: { weddingId },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(messages);
});

// Guest posts a message
guestbookRouter.post('/', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user?.weddingId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const { name, message, emoji } = req.body;

  const created = await prisma.guestbookMessage.create({
    data: {
      weddingId: user.weddingId,
      guestId: user.sub,
      name,
      message,
      emoji,
    },
  });

  return res.status(201).json(created);
});

