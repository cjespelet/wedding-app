import { Router } from 'express';

import { prisma } from '../../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { NOTIFICATION_TYPES } from '../../lib/guest-notifications.js';

export const notificationsRouter = Router();

function labelForType(type: string): string {
  switch (type) {
    case NOTIFICATION_TYPES.PHOTO_LIKE:
      return 'te dio me gusta en una foto';
    case NOTIFICATION_TYPES.PHOTO_COMMENT:
      return 'comentó tu foto';
    case NOTIFICATION_TYPES.COMMENT_LIKE:
      return 'le dio me gusta a tu comentario';
    default:
      return 'actividad nueva';
  }
}

/**
 * GET /notifications/unread-count
 */
notificationsRouter.get('/unread-count', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const guestId = req.user?.sub;
  if (!guestId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const count = await prisma.guestNotification.count({
    where: { guestId, readAt: null },
  });

  return res.json({ count });
});

/**
 * GET /notifications — listado paginado
 */
notificationsRouter.get('/', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const guestId = req.user?.sub;
  const weddingId = req.user?.weddingId;
  if (!guestId || !weddingId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const take = Math.min(50, Math.max(1, Number(req.query.limit) || 30));
  const page = Math.max(0, Number(req.query.page) || 0);
  const skip = page * take;

  const where = { guestId, weddingId };

  const rows = await prisma.guestNotification.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take: take + 1,
    include: {
      actor: { select: { id: true, username: true, fullName: true } },
    },
  });

  const hasMore = rows.length > take;
  const slice = hasMore ? rows.slice(0, take) : rows;

  const unreadCount = await prisma.guestNotification.count({
    where: { guestId, readAt: null },
  });

  return res.json({
    items: slice.map((n) => ({
      id: n.id,
      type: n.type,
      label: labelForType(n.type),
      photoId: n.photoId,
      commentId: n.commentId,
      readAt: n.readAt,
      createdAt: n.createdAt,
      actor: {
        id: n.actor.id,
        username: n.actor.username,
        fullName: n.actor.fullName,
      },
    })),
    page,
    hasMore,
    unreadCount,
  });
});

/**
 * POST /notifications/read-all (antes de /:id/read)
 */
notificationsRouter.post('/read-all', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const guestId = req.user?.sub;
  const weddingId = req.user?.weddingId;
  if (!guestId || !weddingId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  await prisma.guestNotification.updateMany({
    where: { guestId, weddingId, readAt: null },
    data: { readAt: new Date() },
  });

  return res.json({ ok: true });
});

/**
 * POST /notifications/:id/read
 */
notificationsRouter.post('/:id/read', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const guestId = req.user?.sub;
  const weddingId = req.user?.weddingId;
  const { id } = req.params;
  if (!guestId || !weddingId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const n = await prisma.guestNotification.findFirst({
    where: { id, guestId, weddingId },
  });
  if (!n) {
    return res.status(404).json({ error: 'Not found' });
  }

  await prisma.guestNotification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  return res.json({ ok: true });
});
