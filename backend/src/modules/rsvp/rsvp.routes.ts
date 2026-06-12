import { Router } from 'express';
import { prisma } from '../../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';

export const rsvpRouter = Router();

// Guest submits RSVP
rsvpRouter.post('/', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user?.weddingId || !user.sub) {
    return res.status(400).json({ error: 'Invalid token payload' });
  }

  const { attending, numberOfGuests, dietaryRestrictions, comments } = req.body;

  const rsvp = await prisma.rsvp.create({
    data: {
      weddingId: user.weddingId,
      guestId: user.sub,
      attending,
      numberOfGuests,
      dietaryRestrictions,
      comments,
    },
  });

  return res.status(201).json(rsvp);
});

// Guest: get latest RSVP for current guest
rsvpRouter.get('/current', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user?.weddingId || !user.sub) {
    return res.status(400).json({ error: 'Invalid token payload' });
  }

  const rsvp = await prisma.rsvp.findFirst({
    where: { weddingId: user.weddingId, guestId: user.sub },
    orderBy: { createdAt: 'desc' },
  });

  if (!rsvp) {
    return res.status(404).json({ error: 'No RSVP found' });
  }

  return res.json(rsvp);
});

// Admin views RSVP summary
rsvpRouter.get('/stats', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const [totalGuests, confirmedAttending] = await Promise.all([
    prisma.guest.count({ where: { weddingId } }),
    prisma.rsvp.aggregate({
      where: { weddingId, attending: true },
      _sum: { numberOfGuests: true },
    }),
  ]);

  return res.json({
    totalGuests,
    confirmedGuests: confirmedAttending._sum.numberOfGuests ?? 0,
  });
});

