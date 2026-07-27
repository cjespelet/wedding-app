-- QR upload from printed salon code (no login). Idempotent for prod.

ALTER TABLE "Wedding" ADD COLUMN IF NOT EXISTS "allowQrUpload" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Wedding" ADD COLUMN IF NOT EXISTS "qrUploadToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Wedding_qrUploadToken_key" ON "Wedding"("qrUploadToken");

ALTER TABLE "Guest" ADD COLUMN IF NOT EXISTS "isSystemGuest" BOOLEAN NOT NULL DEFAULT false;
