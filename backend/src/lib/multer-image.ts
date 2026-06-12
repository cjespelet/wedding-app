import multer from 'multer';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const multerImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    const err = new Error('Solo se permiten imágenes JPG, PNG o WebP') as Error & { code?: string };
    err.code = 'INVALID_IMAGE_TYPE';
    cb(err);
  },
});
