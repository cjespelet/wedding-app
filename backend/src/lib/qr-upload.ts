import crypto from 'node:crypto';

import { prisma } from '../db/prisma.js';

export const QR_UPLOAD_USERNAME = 'qrupload';
export const QR_UPLOAD_DISPLAY_NAME = 'Salón QR';

export function generateQrUploadToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export async function ensureQrUploadGuest(weddingId: string) {
  const existing = await prisma.guest.findFirst({
    where: { weddingId, isSystemGuest: true, username: QR_UPLOAD_USERNAME },
  });
  if (existing) {
    return existing;
  }

  return prisma.guest.create({
    data: {
      weddingId,
      fullName: QR_UPLOAD_DISPLAY_NAME,
      username: QR_UPLOAD_USERNAME,
      isSystemGuest: true,
      qrCode: `qr-upload-${weddingId}-${crypto.randomUUID()}`,
      adultsCount: 0,
      minorsCount: 0,
      canSharePhotos: false,
    },
  });
}

export async function ensureWeddingQrUploadSetup(weddingId: string) {
  await ensureQrUploadGuest(weddingId);

  const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
  if (!wedding) {
    throw new Error('Wedding not found');
  }
  if (wedding.qrUploadToken) {
    return wedding;
  }

  return prisma.wedding.update({
    where: { id: weddingId },
    data: { qrUploadToken: generateQrUploadToken() },
  });
}

export async function findWeddingForQrUpload(slug: string, token: string | null | undefined) {
  const trimmed = token?.trim();
  if (!slug?.trim() || !trimmed) {
    return null;
  }

  return prisma.wedding.findFirst({
    where: {
      slug: slug.trim(),
      qrUploadToken: trimmed,
      allowQrUpload: true,
    },
  });
}
