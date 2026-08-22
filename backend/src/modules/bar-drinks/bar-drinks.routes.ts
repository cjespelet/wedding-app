import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { prisma } from '../../db/prisma.js';

export const barDrinksRouter = Router();

const GLASS_TYPES = ['highball', 'collins', 'coupe', 'spritz', 'rocks'] as const;

function normalizeGlassType(value?: string): string {
  const normalized = value?.trim().toLowerCase();
  if (normalized && GLASS_TYPES.includes(normalized as (typeof GLASS_TYPES)[number])) {
    return normalized;
  }
  return 'highball';
}

barDrinksRouter.get('/', requireAuth(['guest', 'super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const drinks = await prisma.barDrink.findMany({
    where: { weddingId },
    orderBy: { position: 'asc' },
  });

  return res.json(drinks);
});

barDrinksRouter.post('/', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const { name, description, glassType } = req.body as {
    name?: string;
    description?: string;
    glassType?: string;
  };

  if (!name?.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const last = await prisma.barDrink.findFirst({
    where: { weddingId },
    orderBy: { position: 'desc' },
  });
  const nextPosition = last ? last.position + 1 : 1;

  const created = await prisma.barDrink.create({
    data: {
      weddingId,
      name: name.trim(),
      description: description?.trim() || null,
      glassType: normalizeGlassType(glassType),
      position: nextPosition,
    },
  });

  return res.status(201).json(created);
});

barDrinksRouter.put('/reorder', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const { ids } = req.body as { ids?: string[] };
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  await Promise.all(
    ids.map((id, index) =>
      prisma.barDrink.update({
        where: { id },
        data: { position: index + 1 },
      }),
    ),
  );

  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const reordered = await prisma.barDrink.findMany({
    where: { weddingId },
    orderBy: { position: 'asc' },
  });

  return res.json(reordered);
});

barDrinksRouter.put('/:id', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { name, description, glassType } = req.body as {
    name?: string;
    description?: string;
    glassType?: string;
  };

  const existing = await prisma.barDrink.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Not found' });
  }

  const updated = await prisma.barDrink.update({
    where: { id },
    data: {
      name: name?.trim() ?? existing.name,
      description: description !== undefined ? description.trim() || null : existing.description,
      glassType: glassType !== undefined ? normalizeGlassType(glassType) : existing.glassType,
    },
  });

  return res.json(updated);
});

barDrinksRouter.delete('/:id', requireAuth(['super_admin', 'wedding_admin']), async (req, res) => {
  const { id } = req.params;
  await prisma.barDrink.delete({ where: { id } });
  return res.status(204).end();
});
