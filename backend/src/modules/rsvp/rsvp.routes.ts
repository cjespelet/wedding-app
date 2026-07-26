import { Router } from 'express';
import { prisma } from '../../db/prisma.js';
import { sumConfirmedGuests } from '../../lib/confirmed-guest-count.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';

export const rsvpRouter = Router();

function parseNonNegativeInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.floor(value));
}

// Guest submits RSVP
rsvpRouter.post('/', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user?.weddingId || !user.sub) {
    return res.status(400).json({ error: 'Invalid token payload' });
  }

  const { attending, numberOfGuests, adults, minors, dietaryRestrictions, comments } = req.body;

  const guest = await prisma.guest.findUnique({
    where: { id: user.sub },
    select: { adultsCount: true, minorsCount: true },
  });

  if (!guest) {
    return res.status(404).json({ error: 'Guest not found' });
  }

  const parsedAdults = parseNonNegativeInt(adults);
  const parsedMinors = parseNonNegativeInt(minors);
  const confirmedAdults = parsedAdults ?? guest.adultsCount;
  const confirmedMinors = parsedMinors ?? guest.minorsCount;
  const totalGuests = confirmedAdults + confirmedMinors;

  const rsvp = await prisma.rsvp.create({
    data: {
      weddingId: user.weddingId,
      guestId: user.sub,
      attending: attending ?? true,
      numberOfGuests: totalGuests,
      confirmedAdults,
      confirmedMinors,
      dietaryRestrictions,
      comments,
    },
  });

  return res.status(201).json(rsvp);
});

// Defaults for confirm form (invitation adults/minors)
rsvpRouter.get('/defaults', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user?.sub) {
    return res.status(400).json({ error: 'Invalid token payload' });
  }

  const guest = await prisma.guest.findUnique({
    where: { id: user.sub },
    select: { adultsCount: true, minorsCount: true },
  });

  if (!guest) {
    return res.status(404).json({ error: 'Guest not found' });
  }

  return res.json({
    adults: guest.adultsCount,
    minors: guest.minorsCount,
  });
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

  const [guests, totalGuests] = await Promise.all([
    prisma.guest.findMany({
      where: { weddingId },
      select: {
        adultsCount: true,
        minorsCount: true,
        rsvps: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            attending: true,
            numberOfGuests: true,
            confirmedAdults: true,
            confirmedMinors: true,
          },
        },
      },
    }),
    prisma.guest.count({ where: { weddingId } }),
  ]);

  return res.json({
    totalGuests,
    confirmedGuests: sumConfirmedGuests(guests),
  });
});
