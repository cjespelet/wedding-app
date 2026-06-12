import { Router } from 'express';
import { prisma } from '../../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';

export const djRouter = Router();

// Guest creates song request
djRouter.post('/request', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const { title, artist, comment } = req.body;
  const user = req.user;
  if (!user?.weddingId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const song = await prisma.songRequest.create({
    data: {
      title,
      artist,
      comment,
      weddingId: user.weddingId,
      guestId: user.sub,
    },
  });

  return res.status(201).json(song);
});

// Guest upvotes song
djRouter.post('/vote/:id', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user?.weddingId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const songId = req.params.id;

  const vote = await prisma.songVote.create({
    data: {
      songRequestId: songId,
      guestId: user.sub,
    },
  });

  return res.status(201).json(vote);
});

// Admin creates song request (for testing / manual requests from panel)
djRouter.post('/admin-request', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const { title, artist, comment } = req.body as { title?: string; artist?: string; comment?: string };
  const user = req.user;
  if (!user?.weddingId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  const song = await prisma.songRequest.create({
    data: {
      title,
      artist: artist || '',
      comment: comment || null,
      weddingId: user.weddingId,
      guestId: null,
    },
  });

  return res.status(201).json(song);
});

// DJ dashboard: list requests with vote counts and guest info
djRouter.get('/requests', requireAuth(['dj', 'super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const songs = await prisma.songRequest.findMany({
    where: { weddingId },
    include: {
      votes: true,
      guest: true,
    },
    orderBy: [{ played: 'asc' }, { createdAt: 'asc' }],
  });

  const mapped = songs.map((s) => ({
    ...s,
    voteCount: s.votes.length,
    guestName: s.guest?.fullName ?? null,
    guestUsername: s.guest?.username ?? null,
  }));

  return res.json(mapped);
});

// DJ/Admin marks song as played
djRouter.post('/played/:id', requireAuth(['dj', 'super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const songId = req.params.id;
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const song = await prisma.songRequest.findFirst({
    where: { id: songId, weddingId },
  });
  if (!song) {
    return res.status(404).json({ error: 'Song request not found' });
  }

  const updated = await prisma.songRequest.update({
    where: { id: songId },
    data: { played: true },
  });

  return res.json(updated);
});

