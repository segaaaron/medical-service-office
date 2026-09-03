-- Perfil de TikTok como red social de primera clase.
--
-- Hasta ahora el consultorio solo podía guardar WhatsApp, Facebook e Instagram.
-- El perfil de TikTok existe y es público, pero al no estar en la base de datos
-- había que escribirlo en el código del sitio: no se podía cambiar desde el
-- panel y el `sameAs` del schema quedaba fuera de sincronía con la realidad.
--
-- Nulos a propósito: un consultorio puede no tener TikTok, y una columna
-- obligatoria forzaría a inventar un valor. El frontend solo pinta el icono y
-- solo declara el perfil en el schema cuando hay URL.

ALTER TABLE "Footer"  ADD COLUMN "tiktokUrl"      TEXT;
ALTER TABLE "Contact" ADD COLUMN "tiktokUsername" TEXT;
ALTER TABLE "Contact" ADD COLUMN "tiktokUrl"      TEXT;
