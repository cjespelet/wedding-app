import { prisma } from '../db/prisma.js';

export class GuestDeleteError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'GuestDeleteError';
  }
}

/** Elimina un invitado y todos los datos que bloquean el borrado en PostgreSQL. */
export async function deleteGuestWithRelations(guestId: string, weddingId: string): Promise<void> {
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, weddingId },
    select: { id: true, isSystemGuest: true },
  });

  if (!guest) {
    throw new GuestDeleteError('Invitado no encontrado', 404);
  }

  if (guest.isSystemGuest) {
    throw new GuestDeleteError('No se puede eliminar un invitado del sistema', 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.guestNotification.deleteMany({
      where: { OR: [{ guestId }, { actorId: guestId }] },
    });

    await tx.photoCommentLike.deleteMany({ where: { guestId } });
    await tx.photoComment.deleteMany({ where: { guestId } });
    await tx.photoLike.deleteMany({ where: { guestId } });
    await tx.photoTag.deleteMany({ where: { guestId } });

    const songRequestIds = (
      await tx.songRequest.findMany({
        where: { guestId },
        select: { id: true },
      })
    ).map((s) => s.id);

    if (songRequestIds.length > 0) {
      await tx.songVote.deleteMany({ where: { songRequestId: { in: songRequestIds } } });
      await tx.songRequest.deleteMany({ where: { id: { in: songRequestIds } } });
    }

    await tx.songVote.deleteMany({ where: { guestId } });
    await tx.rsvp.deleteMany({ where: { guestId } });
    await tx.guestbookMessage.deleteMany({ where: { guestId } });

    await tx.invitationCode.updateMany({
      where: { guestId },
      data: { guestId: null },
    });

    await tx.photo.updateMany({
      where: { uploadedByGuestId: guestId },
      data: { uploadedByGuestId: null },
    });

    await tx.guest.delete({ where: { id: guestId } });
  });
}
