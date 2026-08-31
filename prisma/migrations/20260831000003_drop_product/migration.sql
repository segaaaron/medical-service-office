-- Elimina la tabla de productos, que nunca llego a formar parte del producto.
--
-- Venia de la migracion inicial de abril con un catalogo de articulos con
-- precio y stock. El consultorio nunca vendio productos: no hay modelo en
-- schema.prisma, ningun codigo la consulta, no tiene claves foraneas y en
-- produccion tenia 0 filas.
DROP TABLE IF EXISTS "Product";
