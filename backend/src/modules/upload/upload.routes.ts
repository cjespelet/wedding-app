import { Router } from 'express';

import { uploadImageBufferToCloudinary } from '../../lib/cloudinary-images.js';
import { multerImage } from '../../lib/multer-image.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';

/**
 * Generic image upload: multipart field `image`, returns `{ url }` (Cloudinary secure_url).
 * Auth required; uses `weddingId` from JWT. Folder: `bodas/{weddingId}`.
 */
export const uploadRouter = Router();

uploadRouter.post(
  '/',
  requireAuth(['photographer', 'super_admin', 'guest']),
  multerImage.single('image'),
  async (req: AuthenticatedRequest, res) => {
    const weddingId = req.user?.weddingId;
    if (!weddingId) {
      return res.status(400).json({ error: 'No weddingId on token' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const id = crypto.randomUUID();

    try {
      const result = await uploadImageBufferToCloudinary(req.file.buffer, weddingId, id);
      return res.status(201).json({ url: result.secure_url });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Cloudinary upload failed', err);
      return res.status(500).json({ error: 'Upload failed' });
    }
  },
);

/**
 * BONUS: multiple files in one request (field `images`, max 10).
 */
uploadRouter.post(
  '/multiple',
  requireAuth(['photographer', 'super_admin', 'guest']),
  multerImage.array('images', 10),
  async (req: AuthenticatedRequest, res) => {
    const weddingId = req.user?.weddingId;
    if (!weddingId) {
      return res.status(400).json({ error: 'No weddingId on token' });
    }

    const files = req.files;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const urls: string[] = [];

    try {
      for (const file of files) {
        const id = crypto.randomUUID();
        const result = await uploadImageBufferToCloudinary(file.buffer, weddingId, id);
        urls.push(result.secure_url);
      }
      return res.status(201).json({ urls });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Cloudinary upload failed', err);
      return res.status(500).json({ error: 'Upload failed' });
    }
  },
);
