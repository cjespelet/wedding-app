import type { PrismaClient } from '@prisma/client';

export const NOTIFICATION_TYPES = {
  PHOTO_LIKE: 'PHOTO_LIKE',
  PHOTO_COMMENT: 'PHOTO_COMMENT',
  COMMENT_LIKE: 'COMMENT_LIKE',
} as const;

/**
 * Notifica al dueño de la foto cuando otro invitado le da me gusta.
 */
export async function notifyPhotoLiked(
  prisma: PrismaClient,
  params: { weddingId: string; ownerGuestId: string | null; actorId: string; photoId: string },
): Promise<void> {
  const { weddingId, ownerGuestId, actorId, photoId } = params;
  if (!ownerGuestId || ownerGuestId === actorId) return;
  await prisma.guestNotification.create({
    data: {
      weddingId,
      guestId: ownerGuestId,
      type: NOTIFICATION_TYPES.PHOTO_LIKE,
      actorId,
      photoId,
    },
  });
}

/**
 * Notifica al dueño de la foto cuando alguien comenta (si no es él mismo).
 */
export async function notifyPhotoComment(
  prisma: PrismaClient,
  params: { weddingId: string; ownerGuestId: string | null; actorId: string; photoId: string; commentId: string },
): Promise<void> {
  const { weddingId, ownerGuestId, actorId, photoId, commentId } = params;
  if (!ownerGuestId || ownerGuestId === actorId) return;
  await prisma.guestNotification.create({
    data: {
      weddingId,
      guestId: ownerGuestId,
      type: NOTIFICATION_TYPES.PHOTO_COMMENT,
      actorId,
      photoId,
      commentId,
    },
  });
}

/**
 * Notifica al autor del comentario cuando le dan me gusta al comentario.
 */
export async function notifyCommentLiked(
  prisma: PrismaClient,
  params: {
    weddingId: string;
    commentAuthorId: string;
    actorId: string;
    photoId: string;
    commentId: string;
  },
): Promise<void> {
  const { weddingId, commentAuthorId, actorId, photoId, commentId } = params;
  if (commentAuthorId === actorId) return;
  await prisma.guestNotification.create({
    data: {
      weddingId,
      guestId: commentAuthorId,
      type: NOTIFICATION_TYPES.COMMENT_LIKE,
      actorId,
      photoId,
      commentId,
    },
  });
}
