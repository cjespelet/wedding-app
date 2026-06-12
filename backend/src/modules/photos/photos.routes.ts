import { Router } from 'express';

import { prisma } from '../../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { notifyPhotoLiked } from '../../lib/guest-notifications.js';

export const photosRouter = Router();

const MAX_LIMIT = 40;
const DEFAULT_LIMIT = 15;
const MAX_COMMENT = 500;

async function syncPhotoLikesCount(photoId: string): Promise<number> {
  const count = await prisma.photoLike.count({ where: { photoId } });
  await prisma.photo.update({
    where: { id: photoId },
    data: { likes: count },
  });
  return count;
}

/**
 * GET /photos — feed paginado (invitado, misma boda)
 * Query: page, limit, mine=1 | userId=<guestId>
 */
photosRouter.get('/', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  const guestId = req.user?.sub;
  if (!weddingId || !guestId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const page = Math.max(0, Number(req.query.page) || 0);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT));
  const skip = page * limit;

  const mine = req.query.mine === '1' || req.query.mine === 'true';
  const filterUserId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';

  const where: {
    weddingId: string;
    approved: boolean;
    uploadedByGuestId?: string;
  } = {
    weddingId,
    approved: true,
  };

  if (mine) {
    where.uploadedByGuestId = guestId;
  } else if (filterUserId) {
    const g = await prisma.guest.findFirst({
      where: { id: filterUserId, weddingId },
      select: { id: true },
    });
    if (!g) {
      return res.status(404).json({ error: 'Usuario no encontrado en esta boda' });
    }
    where.uploadedByGuestId = filterUserId;
  }

  const rows = await prisma.photo.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take: limit + 1,
    include: {
      uploadedBy: {
        select: { id: true, username: true, fullName: true },
      },
      _count: {
        select: { photoLikes: true, comments: true },
      },
    },
  });

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const photoIds = slice.map((p) => p.id);

  const myLikes =
    photoIds.length === 0
      ? []
      : await prisma.photoLike.findMany({
          where: { guestId, photoId: { in: photoIds } },
          select: { photoId: true },
        });
  const likedSet = new Set(myLikes.map((l) => l.photoId));

  const items = slice.map((p) => ({
    id: p.id,
    weddingId: p.weddingId,
    originalUrl: p.originalUrl,
    largeUrl: p.largeUrl,
    mediumUrl: p.mediumUrl,
    squareUrl: p.squareUrl,
    highlighted: p.highlighted,
    approved: p.approved,
    createdAt: p.createdAt,
    likes: p.likes,
    likesCount: p.likes,
    likedByMe: likedSet.has(p.id),
    commentsCount: p._count.comments,
    author: p.uploadedBy
      ? {
          id: p.uploadedBy.id,
          username: p.uploadedBy.username,
          fullName: p.uploadedBy.fullName,
        }
      : null,
  }));

  return res.json({
    items,
    page,
    limit,
    hasMore,
  });
});

/**
 * GET /photos/detail/:photoId — una foto del feed (misma boda, aprobada)
 * Para abrir desde notificación cuando no está en la página actual del feed.
 */
photosRouter.get('/detail/:photoId', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  const guestId = req.user?.sub;
  const { photoId } = req.params;
  if (!weddingId || !guestId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const p = await prisma.photo.findFirst({
    where: { id: photoId, weddingId, approved: true },
    include: {
      uploadedBy: {
        select: { id: true, username: true, fullName: true },
      },
      _count: {
        select: { photoLikes: true, comments: true },
      },
    },
  });

  if (!p) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  const myLike = await prisma.photoLike.findUnique({
    where: { photoId_guestId: { photoId, guestId } },
  });

  return res.json({
    id: p.id,
    weddingId: p.weddingId,
    originalUrl: p.originalUrl,
    largeUrl: p.largeUrl,
    mediumUrl: p.mediumUrl,
    squareUrl: p.squareUrl,
    highlighted: p.highlighted,
    approved: p.approved,
    createdAt: p.createdAt,
    likes: p.likes,
    likesCount: p.likes,
    likedByMe: !!myLike,
    commentsCount: p._count.comments,
    author: p.uploadedBy
      ? {
          id: p.uploadedBy.id,
          username: p.uploadedBy.username,
          fullName: p.uploadedBy.fullName,
        }
      : null,
  });
});

/**
 * POST /photos/:photoId/like — toggle like (misma boda)
 */
photosRouter.post('/:photoId/like', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  const guestId = req.user?.sub;
  const { photoId } = req.params;
  if (!weddingId || !guestId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, weddingId, approved: true },
  });
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  const existing = await prisma.photoLike.findUnique({
    where: { photoId_guestId: { photoId, guestId } },
  });

  if (existing) {
    await prisma.photoLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.photoLike.create({
      data: { photoId, guestId },
    });
    try {
      await notifyPhotoLiked(prisma, {
        weddingId,
        ownerGuestId: photo.uploadedByGuestId,
        actorId: guestId,
        photoId,
      });
    } catch {
      /* no bloquear like si falla notificación */
    }
  }

  const likes = await syncPhotoLikesCount(photoId);
  const likedByMe = !existing;

  return res.json({
    id: photoId,
    likes,
    likesCount: likes,
    likedByMe,
  });
});

/**
 * GET /photos/:photoId/likes — quién dio like
 */
photosRouter.get('/:photoId/likes', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  const guestId = req.user?.sub;
  const { photoId } = req.params;
  if (!weddingId || !guestId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, weddingId, approved: true },
  });
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  if (!photo.uploadedByGuestId || photo.uploadedByGuestId !== guestId) {
    return res.status(403).json({
      error: 'Solo el autor de la foto puede ver quién dio me gusta',
      code: 'LIKES_LIST_OWNER_ONLY',
    });
  }

  const likes = await prisma.photoLike.findMany({
    where: { photoId },
    orderBy: { createdAt: 'asc' },
    include: {
      guest: {
        select: { username: true, fullName: true },
      },
    },
  });

  return res.json({
    users: likes.map((l) => ({
      username: l.guest.username,
      fullName: l.guest.fullName,
    })),
  });
});

/**
 * GET /photos/:photoId/comments
 */
photosRouter.get('/:photoId/comments', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  const guestId = req.user?.sub;
  const { photoId } = req.params;
  if (!weddingId || !guestId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, weddingId, approved: true },
  });
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  const page = Math.max(0, Number(req.query.page) || 0);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 30));
  const skip = page * limit;

  const comments = await prisma.photoComment.findMany({
    where: { photoId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    skip,
    take: limit + 1,
    include: {
      guest: { select: { id: true, username: true, fullName: true } },
      _count: { select: { likes: true } },
    },
  });

  const hasMore = comments.length > limit;
  const slice = hasMore ? comments.slice(0, limit) : comments;
  const commentIds = slice.map((c) => c.id);

  const myCommentLikes =
    commentIds.length === 0
      ? []
      : await prisma.photoCommentLike.findMany({
          where: { guestId, commentId: { in: commentIds } },
          select: { commentId: true },
        });
  const likedCommentSet = new Set(myCommentLikes.map((x) => x.commentId));

  return res.json({
    items: slice.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      author: {
        id: c.guest.id,
        username: c.guest.username,
        fullName: c.guest.fullName,
      },
      likesCount: c._count.likes,
      likedByMe: likedCommentSet.has(c.id),
    })),
    page,
    hasMore,
  });
});
