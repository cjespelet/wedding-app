import { Readable } from 'node:stream';

import { cloudinary } from '../config/cloudinary.js';

export type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
};

/**
 * Upload raw image buffer to Cloudinary under folder `bodas/{weddingId}/{publicId}`.
 */
export function uploadImageBufferToCloudinary(
  buffer: Buffer,
  weddingId: string,
  publicId: string,
): Promise<CloudinaryUploadResult> {
  const folder = `bodas/${weddingId}`;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
        unique_filename: false,
        use_filename: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary upload returned no result'));
          return;
        }
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
        });
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

/**
 * Build delivery URLs for the same uploaded asset (EXIF auto-orient + size variants).
 */
export function buildPhotoVariantUrls(publicId: string): {
  originalUrl: string;
  largeUrl: string;
  mediumUrl: string;
  squareUrl: string;
} {
  const base = { secure: true } as const;

  const originalUrl = cloudinary.url(publicId, {
    ...base,
    transformation: [{ angle: 'auto' }, { quality: 'auto:good', fetch_format: 'auto' }],
  });

  const largeUrl = cloudinary.url(publicId, {
    ...base,
    transformation: [
      { angle: 'auto' },
      { width: 1920, height: 1080, crop: 'limit' },
      { quality: 'auto:good' },
    ],
  });

  const mediumUrl = cloudinary.url(publicId, {
    ...base,
    transformation: [
      { angle: 'auto' },
      { width: 1400, height: 1400, crop: 'limit' },
      { quality: 'auto:good' },
    ],
  });

  const squareUrl = cloudinary.url(publicId, {
    ...base,
    transformation: [
      { angle: 'auto' },
      { width: 1000, height: 1000, crop: 'fill', gravity: 'auto' },
      { quality: 'auto:good' },
    ],
  });

  return { originalUrl, largeUrl, mediumUrl, squareUrl };
}

/**
 * Obtiene el public_id de una URL de entrega de Cloudinary (assets subidos bajo `bodas/...`).
 * Devuelve null si no es Cloudinary o no coincide el patrón (p. ej. URLs viejas `/uploads/...`).
 */
export function extractPublicIdFromCloudinaryUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  if (!url.includes('cloudinary.com')) {
    return null;
  }
  const match = url.match(/\/(bodas\/[^?]+?)\.(?:jpg|jpeg|png|webp|gif)(?:\?|$)/i);
  if (!match?.[1]) {
    return null;
  }
  return match[1];
}

/**
 * Elimina el asset en Cloudinary. Si la URL no es de Cloudinary (o no se puede extraer public_id), no hace nada.
 */
export async function deleteCloudinaryImageByUrl(url: string): Promise<{ deleted: boolean; skipped: boolean }> {
  const publicId = extractPublicIdFromCloudinaryUrl(url);
  if (!publicId) {
    return { deleted: false, skipped: true };
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: 'image' }, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      const ok = result && (result as { result?: string }).result === 'ok';
      const notFound = result && (result as { result?: string }).result === 'not found';
      resolve({ deleted: ok || notFound, skipped: false });
    });
  });
}
