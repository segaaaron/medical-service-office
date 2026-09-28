-- SEO por registro (Treatment y BlogPost). Aditivo: columnas nullable.
ALTER TABLE "Treatment" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "Treatment" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
ALTER TABLE "Treatment" ADD COLUMN IF NOT EXISTS "og_image_url" TEXT;

ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "og_image_url" TEXT;

-- Datos: conserva los títulos de Google que hoy vivían hardcodeados en el
-- frontend (medical-webApp/lib/seo/treatment-names.ts, SEARCH_TERMS).
-- Idempotente: solo rellena donde seo_title sigue vacío.
UPDATE "Treatment" AS t
SET "seo_title" = v.title
FROM (VALUES
  ('toxina-botulinica-botox', 'Botox'),
  ('acido-hialuronico', 'Ácido Hialurónico'),
  ('aumento-y-perfilado-de-labios-con-hialuronico', 'Relleno de Labios'),
  ('rinomodelacion-con-hialuronico', 'Rinomodelación sin Cirugía'),
  ('hiperhidrosis---tratamiento-para-sudoracion-excesiva-con-toxina-botulinica', 'Botox para Sudoración Excesiva'),
  ('mesoterapia', 'Mesoterapia Facial'),
  ('radiofrecuencia-fraccionada-fraxface', 'Radiofrecuencia Facial'),
  ('nctf-135-ha---oro-rosa', 'Mesoterapia con Vitaminas'),
  ('pdrn-polinucleotidos-de-esperma-de-salmon', 'Bioestimulador de Colágeno'),
  ('plasma-rico-en-factores-de-crecimiento-prp', 'Plasma Rico en Plaquetas (PRP)'),
  ('peeling-quimico', 'Peeling Químico')
) AS v(slug, title)
WHERE t.slug = v.slug AND t."seo_title" IS NULL;
