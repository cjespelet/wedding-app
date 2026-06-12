import { Router } from 'express';

import { prisma } from '../../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { notifyCommentLiked, notifyPhotoComment } from '../../lib/guest-notifications.js';

export const commentsRouter = Router();

const MAX_COMMENT = 500;

/**
 * POST /comments — body: { photoId, content }
 */
commentsRouter.post('/', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  const guestId = req.user?.sub;
  if (!weddingId || !guestId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const { photoId, content } = req.body as { photoId?: string; content?: string };
  if (!photoId || typeof content !== 'string') {
    return res.status(400).json({ error: 'photoId y content son requeridos' });
  }

  const trimmed = content.trim();
  if (!trimmed.length) {
    return res.status(400).json({ error: 'El comentario no puede estar vacío' });
  }
  if (trimmed.length > MAX_COMMENT) {
    return res.status(400).json({ error: `Máximo ${MAX_COMMENT} caracteres` });
  }

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, weddingId, approved: true },
  });
  if (!photo) {
    return res.status(404).json({ error: 'Foto no encontrada' });
  }

  const created = await prisma.photoComment.create({
    data: {
      photoId,
      guestId,
      content: trimmed,
    },
    include: {
      guest: { select: { id: true, username: true, fullName: true } },
      _count: { select: { likes: true } },
    },
  });

  try {
    await notifyPhotoComment(prisma, {
      weddingId,
      ownerGuestId: photo.uploadedByGuestId,
      actorId: guestId,
      photoId,
      commentId: created.id,
    });
  } catch {
    /* */
  }

  return res.status(201).json({
    id: created.id,
    content: created.content,
    createdAt: created.createdAt,
    author: {
      id: created.guest.id,
      username: created.guest.username,
      fullName: created.guest.fullName,
    },
    likesCount: created._count.likes,
    likedByMe: false,
  });
});

/**
 * POST /comments/:commentId/like — toggle like en comentario
 */
commentsRouter.post('/:commentId/like', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  const guestId = req.user?.sub;
  const { commentId } = req.params;
  if (!weddingId || !guestId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const comment = await prisma.photoComment.findFirst({
    where: { id: commentId },
    include: { photo: true },
  });

  if (!comment || comment.photo.weddingId !== weddingId || !comment.photo.approved) {
    return res.status(404).json({ error: 'Comentario no encontrado' });
  }

  const existing = await prisma.photoCommentLike.findUnique({
    where: { commentId_guestId: { commentId, guestId } },
  });

  if (existing) {
    await prisma.photoCommentLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.photoCommentLike.create({
      data: { commentId, guestId },
    });
    try {
      await notifyCommentLiked(prisma, {
        weddingId,
        commentAuthorId: comment.guestId,
        actorId: guestId,
        photoId: comment.photoId,
        commentId,
      });
    } catch {
      /* */
    }
  }

  const likesCount = await prisma.photoCommentLike.count({ where: { commentId } });
  const likedByMe = !existing;

  return res.json({
    id: commentId,
    likesCount,
    likedByMe,
  });
});
