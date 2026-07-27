-- Actualizar link de Google Maps en prod (campo instructions de la app).
-- Sueño verde, Tandil — coordenadas: -37.344203770971994, -59.15733890278335

UPDATE "Wedding"
SET instructions = 'https://www.google.com/maps?q=-37.344203770971994,-59.15733890278335'
WHERE slug = 'demo-wedding';

SELECT slug, location, instructions FROM "Wedding" WHERE slug = 'demo-wedding';
