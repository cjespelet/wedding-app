-- Carga inicial de tragos de barra para la boda demo (solo si la tabla está vacía).
-- Ejecutar en prod después de la migración 20260822180000_bar_drinks.

INSERT INTO "BarDrink" ("id", "weddingId", "name", "description", "glassType", "position", "createdAt", "updatedAt")
SELECT
  'bar_drink_' || d.position,
  w.id,
  d.name,
  d.description,
  d."glassType",
  d.position,
  NOW(),
  NOW()
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
