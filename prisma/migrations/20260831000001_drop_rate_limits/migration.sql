-- Elimina la tabla del limitador de reseñas del formulario público retirado.
--
-- El formulario abierto ya no existe (POST /api/reviews responde 410 GONE): las
-- reseñas nacen de una invitación con token de un solo uso, que es un control
-- más fuerte que un tope por IP. El limitador que usaba esta tabla no estaba
-- montado en ninguna ruta y la tabla estaba vacía en producción (0 filas).
DROP TABLE IF EXISTS "rate_limits";
