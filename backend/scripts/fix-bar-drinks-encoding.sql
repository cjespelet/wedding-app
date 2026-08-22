-- Corrige acentos en descripciones de tragos (por si se insertaron mal por encoding).
UPDATE "BarDrink" SET "description" = 'Clásico argentino' WHERE "name" = 'Fernet con Coca-Cola';
UPDATE "BarDrink" SET "description" = 'Gancia, Sprite y limón fresco' WHERE "name" = 'Gancia batida';
UPDATE "BarDrink" SET "description" = 'Gin, agua tónica y rodaja de limón' WHERE "name" = 'Gin Tonic';
