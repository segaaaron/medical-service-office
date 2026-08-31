-- Contactos del formulario web. Antes el frontend intentaba crear esta tabla
-- por su cuenta con `CREATE TABLE IF NOT EXISTS leads`, pero nunca tuvo
-- credenciales de base, así que no existía y cada contacto se perdía.
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(30),
    "treatment" VARCHAR(150),
    "message" VARCHAR(2000),
    "preferred_date" VARCHAR(10),
    "source" VARCHAR(60) NOT NULL DEFAULT 'contact-form',
    "ip_hash" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "leads_created_at_idx" ON "leads"("created_at" DESC);
