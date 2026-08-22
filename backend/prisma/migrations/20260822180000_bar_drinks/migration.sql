-- CreateTable
CREATE TABLE "BarDrink" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "glassType" TEXT NOT NULL DEFAULT 'highball',
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarDrink_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BarDrink" ADD CONSTRAINT "BarDrink_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default bar drinks for demo wedding
INSERT INTO "BarDrink" ("id", "weddingId", "name", "description", "glassType", "position", "createdAt", "updatedAt")
SELECT
  'bar_drink_' || d.position,
  w.id,
  d.name,
  d.description,
  d."glassType",
  d.position,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Wedding" w
CROSS JOIN (
  VALUES
    ('Fernet con Coca-Cola', 'Clásico argentino', 'highball', 1),
    ('Gancia batida', 'Gancia, Sprite y limón fresco', 'collins', 2),
    ('Vodka con naranja', 'Vodka y jugo de naranja', 'highball', 3),
    ('Gin Tonic', 'Gin, agua tónica y rodaja de limón', 'coupe', 4),
    ('Aperol Spritz', 'Aperol con pomelo o soda', 'spritz', 5),
    ('Caipirinha', 'Cachaça, lima fresca y azúcar', 'rocks', 6),
    ('Caipiroska', 'Vodka, lima fresca y azúcar', 'rocks', 7)
) AS d(name, description, "glassType", position)
WHERE w.slug = 'demo-wedding'
  AND NOT EXISTS (SELECT 1 FROM "BarDrink" b WHERE b."weddingId" = w.id);
