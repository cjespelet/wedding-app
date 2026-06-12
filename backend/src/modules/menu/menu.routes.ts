import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { prisma } from '../../db/prisma.js';

export const menuRouter = Router();

// List all menu steps for this wedding (visible para invitados y admin)
menuRouter.get('/', requireAuth(['guest', 'super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const steps = await prisma.menuStep.findMany({
    where: { weddingId },
    orderBy: { position: 'asc' },
  });

  return res.json(steps);
});

// Create step
menuRouter.post('/', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const { time, title, description } = req.body as { time?: string; title?: string; description?: string };
  if (!time || !title || !description) {
    return res.status(400).json({ error: 'time, title and description are required' });
  }

  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const last = await prisma.menuStep.findFirst({
    where: { weddingId },
    orderBy: { position: 'desc' },
  });
  const nextPosition = last ? last.position + 1 : 1;

  const created = await prisma.menuStep.create({
    data: {
      weddingId,
      time,
      title,
      description,
      position: nextPosition,
    },
  });

  return res.status(201).json(created);
});

// Update step
menuRouter.put('/:id', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { time, title, description } = req.body as { time?: string; title?: string; description?: string };

  const existing = await prisma.menuStep.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Not found' });
  }

  const updated = await prisma.menuStep.update({
    where: { id },
    data: {
      time: time ?? existing.time,
      title: title ?? existing.title,
      description: description ?? existing.description,
    },
  });

  return res.json(updated);
});

// Delete step
menuRouter.delete('/:id', requireAuth(['super_admin', 'wedding_admin']), async (req, res) => {
  const { id } = req.params;
  await prisma.menuStep.delete({ where: { id } });
  return res.status(204).end();
});

// Reorder steps (drag & drop)
menuRouter.put('/reorder', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const { ids } = req.body as { ids?: string[] };
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  await Promise.all(
    ids.map((id, index) =>
      prisma.menuStep.update({
        where: { id },
        data: { position: index + 1 },
      }),
    ),
  );

  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const reordered = await prisma.menuStep.findMany({
    where: { weddingId },
    orderBy: { position: 'asc' },
  });

  return res.json(reordered);
});

