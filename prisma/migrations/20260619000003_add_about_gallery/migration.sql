-- Galería "Nosotros" (colage de congresos, hasta 10 fotos).
-- Array de rutas /uploads/. Vacío por defecto (no rompe el GET existente).
ALTER TABLE "AboutUs" ADD COLUMN "gallery" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
