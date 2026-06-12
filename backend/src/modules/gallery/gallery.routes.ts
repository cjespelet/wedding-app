import { Router } from 'express';

import { prisma } from '../../db/prisma.js';
import { buildPhotoVariantUrls, uploadImageBufferToCloudinary } from '../../lib/cloudinary-images.js';
import { multerImage } from '../../lib/multer-image.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';

export const galleryRouter = Router();

// Public gallery for logged-in guest (uses weddingId from token)
galleryRouter.get('/', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const photos = await prisma.photo.findMany({
    where: {
      weddingId,
      approved: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(photos);
});

// Photographer uploads photos (multipart field `photos`, up to 20)
galleryRouter.post(
  '/upload',
  requireAuth(['photographer', 'super_admin']),
  multerImage.array('photos', 20),
  async (req: AuthenticatedRequest, res) => {
    const weddingId = req.user?.weddingId;
    if (!weddingId) {
      return res.status(400).json({ error: 'No weddingId on token' });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const created: unknown[] = [];

    try {
      for (const file of req.files as Express.Multer.File[]) {
        const id = crypto.randomUUID();
        const result = await uploadImageBufferToCloudinary(file.buffer, weddingId, id);
        const urls = buildPhotoVariantUrls(result.public_id);

        const photo = await prisma.photo.create({
          data: {
            id,
            weddingId,
            originalUrl: urls.originalUrl,
            largeUrl: urls.largeUrl,
            mediumUrl: urls.mediumUrl,
            squareUrl: urls.squareUrl,
            approved: true,
          },
        });

        created.push(photo);
      }

      return res.status(201).json(created);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Gallery upload (photographer) failed', err);
      return res.status(500).json({ error: 'Upload failed' });
    }
  },
);

// Guest uploads photos during the event (multipart `photos`, up to 5)
galleryRouter.post(
  '/upload-guest',
  requireAuth(['guest']),
  multerImage.array('photos', 5),
  async (req: AuthenticatedRequest, res) => {
    const weddingId = req.user?.weddingId;
    const guestId = req.user?.sub;
    if (!weddingId || !guestId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const created: unknown[] = [];

    try {
      for (const file of req.files as Express.Multer.File[]) {
        const id = crypto.randomUUID();
        const result = await uploadImageBufferToCloudinary(file.buffer, weddingId, id);
        const urls = buildPhotoVariantUrls(result.public_id);

        const photo = await prisma.photo.create({
          data: {
            id,
            weddingId,
            originalUrl: urls.originalUrl,
            largeUrl: urls.largeUrl,
            mediumUrl: urls.mediumUrl,
            squareUrl: urls.squareUrl,
            approved: true,
            uploadedByGuestId: guestId,
          },
        });

        created.push(photo);
      }

      return res.status(201).json(created);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Gallery upload (guest) failed', err);
      return res.status(500).json({ error: 'Upload failed' });
    }
  },
);

// Registrar intento de compartir foto (aplica reglas de wedding/guest)
galleryRouter.post('/share', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  const weddingId = user?.weddingId;
  const guestId = user?.sub;

  if (!weddingId || !guestId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const [wedding, guest] = await Promise.all([
    prisma.wedding.findUnique({ where: { id: weddingId } }),
    prisma.guest.findUnique({ where: { id: guestId } }),
  ]);

  if (!wedding || !guest) {
    return res.status(404).json({ error: 'Wedding or guest not found' });
  }

  if (!wedding.allowPhotoSharing) {
    return res.status(403).json({ code: 'SHARING_DISABLED_GLOBALLY', error: 'El anfitrión deshabilitó compartir fotos.' });
  }

  if (!guest.canSharePhotos) {
    return res.status(403).json({ code: 'SHARING_DISABLED_FOR_GUEST', error: 'No tenés permiso para compartir fotos.' });
  }

  if (guest.photoSharesCount >= wedding.maxSharesPerGuest) {
    return res.status(403).json({
      code: 'SHARING_LIMIT_REACHED',
      error: 'Ya alcanzaste el máximo de veces que podés compartir fotos.',
    });
  }

  const updatedGuest = await prisma.guest.update({
    where: { id: guest.id },
    data: { photoSharesCount: { increment: 1 } },
    select: { photoSharesCount: true },
  });

  return res.json({
    ok: true,
    remaining: Math.max(wedding.maxSharesPerGuest - updatedGuest.photoSharesCount, 0),
  });
});

// Consultar si el invitado actual puede compartir (sin incrementar contador)
galleryRouter.get('/share-status', requireAuth(['guest']), async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  const weddingId = user?.weddingId;
  const guestId = user?.sub;

  if (!weddingId || !guestId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const [wedding, guest] = await Promise.all([
    prisma.wedding.findUnique({ where: { id: weddingId } }),
    prisma.guest.findUnique({ where: { id: guestId } }),
  ]);

  if (!wedding || !guest) {
    return res.status(404).json({ error: 'Wedding or guest not found' });
  }

  if (!wedding.allowPhotoSharing) {
    return res.status(403).json({ code: 'SHARING_DISABLED_GLOBALLY', error: 'El anfitrión deshabilitó compartir fotos.' });
  }

  if (!guest.canSharePhotos) {
    return res.status(403).json({ code: 'SHARING_DISABLED_FOR_GUEST', error: 'No tenés permiso para compartir fotos.' });
  }

  if (guest.photoSharesCount >= wedding.maxSharesPerGuest) {
    return res.status(403).json({
      code: 'SHARING_LIMIT_REACHED',
      error: 'Ya alcanzaste el máximo de veces que podés compartir fotos.',
    });
  }

  return res.json({
    ok: true,
    remaining: Math.max(wedding.maxSharesPerGuest - guest.photoSharesCount, 0),
  });
});

// Likes: usar POST /api/photos/:photoId/like (toggle). Mantener compat: redirige lógica obsoleta.
// Public gallery for a wedding (by id param) - dejar al final para no capturar otras rutas
galleryRouter.get('/:weddingId', async (req, res) => {
  const { weddingId } = req.params;
  const photos = await prisma.photo.findMany({
    where: {
      weddingId,
      approved: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(photos);
});
