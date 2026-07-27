-- Crear invitado sistema qrupload y token de subida QR (prod Render).
-- Ejecutar una vez; idempotente si se vuelve a correr.

DO $$
DECLARE
  w_id TEXT;
  guest_id TEXT;
  new_token TEXT;
BEGIN
  SELECT id INTO w_id FROM "Wedding" WHERE slug = 'demo-wedding' LIMIT 1;
  IF w_id IS NULL THEN
    RAISE EXCEPTION 'Wedding demo-wedding not found';
  END IF;

  SELECT id INTO guest_id
  FROM "Guest"
  WHERE "weddingId" = w_id AND username = 'qrupload'
  LIMIT 1;

  IF guest_id IS NULL THEN
    INSERT INTO "Guest" (
      id, "weddingId", "fullName", username, "qrCode",
      "adultsCount", "minorsCount", "isSystemGuest", "canSharePhotos",
      "createdAt", "updatedAt"
    ) VALUES (
      md5(random()::text || clock_timestamp()::text),
      w_id,
      'Salón QR',
      'qrupload',
      'qr-upload-' || w_id || '-' || md5(random()::text),
      0,
      0,
      true,
      false,
      NOW(),
      NOW()
    );
  ELSE
    UPDATE "Guest"
    SET "isSystemGuest" = true, "fullName" = 'Salón QR', "canSharePhotos" = false
    WHERE id = guest_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "Wedding" WHERE id = w_id AND "qrUploadToken" IS NOT NULL) THEN
    new_token := md5(random()::text || clock_timestamp()::text || w_id);
    UPDATE "Wedding"
    SET "qrUploadToken" = new_token, "allowQrUpload" = true
    WHERE id = w_id;
  END IF;
END $$;

SELECT slug, "allowQrUpload", "qrUploadToken" FROM "Wedding" WHERE slug = 'demo-wedding';
