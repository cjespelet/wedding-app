import { Router } from 'express';
import { prisma } from '../../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';

export const djMessagesRouter = Router();

// List DJ messages
djMessagesRouter.get('/', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const messages = await prisma.djMessage.findMany({
    where: { weddingId },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });

  return res.json(messages);
});

// Create DJ message
djMessagesRouter.post('/', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const { message_text, priority } = req.body as { message_text?: string; priority?: number };
  if (!message_text) {
    return res.status(400).json({ error: 'message_text is required' });
  }

  const created = await prisma.djMessage.create({
    data: {
      weddingId,
      messageText: message_text,
      priority: priority ?? 0,
    },
  });

  return res.status(201).json(created);
});

// Delete DJ message
djMessagesRouter.delete('/:id', requireAuth(['super_admin', 'wedding_admin']), async (req, res) => {
  const { id } = req.params;
  await prisma.djMessage.delete({ where: { id } });
  return res.status(204).end();
});

