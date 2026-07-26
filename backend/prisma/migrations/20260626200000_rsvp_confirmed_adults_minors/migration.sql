-- Store adults/minors confirmed separately (not only a free-form total).
ALTER TABLE "Rsvp" ADD COLUMN IF NOT EXISTS "confirmed_adults" INTEGER;
ALTER TABLE "Rsvp" ADD COLUMN IF NOT EXISTS "confirmed_minors" INTEGER;
