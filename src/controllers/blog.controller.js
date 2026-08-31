const prisma = require('../services/prisma.service');
const { toSlug } = require('../utils/slug');
const { createWithUniqueSlug } = require('../services/uniqueSlug.service');
const { deleteUploadedFile } = require('../middlewares/upload.middleware');

// Tamaño de página fijado por el backend (el frontend no lo envía).
const BLOG_PAGE_SIZE = 20;
// Orden determinístico para que no se repitan/falten posts entre páginas.
const BLOG_ORDER_BY = [{ publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];

const BLOG_SELECT = {
  id: true, title: true, slug: true, excerpt: true,
  content: true, imageUrl: true, published: true,
  publishedAt: true, createdAt: true,
};

async function listPosts(req, res, next) {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const where = isAdmin ? {} : { published: true };

    // SIN `page` → array completo. Lo consumen la web pública /blog y el fallback
    // estático. NO paginar aquí.
    if (req.query.page === undefined) {
      const posts = await prisma.blogPost.findMany({ where, orderBy: BLOG_ORDER_BY, select: BLOG_SELECT });
      return res.json(posts);
    }

    // CON `page` → objeto paginado. limit lo fija el backend.
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = BLOG_PAGE_SIZE;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.blogPost.findMany({ where, orderBy: BLOG_ORDER_BY, select: BLOG_SELECT, skip, take: limit }),
      prisma.blogPost.count({ where }),
    ]);

    return res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

/**
 * Superficie de administración: SIEMPRE devuelve todos los registros.
 *
 * Separada a propósito de `listPosts`. Aquel endpoint atiende a dos consumidores
 * con contratos opuestos y decide qué mostrar según haya token o no, así que una
 * sesión caducada degrada el panel a "visitante" en silencio y le esconde los
 * borradores. Aquí la autenticación de ADMIN es obligatoria en la ruta: o ves
 * todo, o recibes un 401 explícito. No hay estado intermedio ni paginación —
 * el panel es una herramienta de trabajo, no una vitrina.
 */
async function listAllPosts(req, res, next) {
  try {
    const posts = await prisma.blogPost.findMany({ orderBy: BLOG_ORDER_BY });
    return res.json(posts);
  } catch (err) {
    next(err);
  }
}

async function getPost(req, res, next) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id },
    });
    if (!post) return res.status(404).json({ error: 'Publicación no encontrada' });
    return res.json(post);
  } catch (err) {
    next(err);
  }
}

async function createPost(req, res, next) {
  try {
    const { title, excerpt, content, published } = req.body;
    // req.imageUrl is set by compressAndSave if a file was uploaded;
    // req.body.imageUrl is the URL injected by mergeImageUrl (same value) or a URL sent by the client.
    // After validate, req.body.imageUrl is the validated value. Use it as fallback.
    const imageUrl = req.imageUrl ?? req.body.imageUrl ?? null;

    const slug = toSlug(title);
    if (!slug) return res.status(400).json({ error: 'El título debe contener al menos un carácter alfanumérico' });

    // Dos publicaciones pueden llamarse igual: el título no es una llave, el id
    // sí. Solo la URL debe ser única, y de eso se encarga createWithUniqueSlug.
    const post = await createWithUniqueSlug(slug, (uniqueSlug) => prisma.blogPost.create({
      data: {
        title,
        slug: uniqueSlug,
        excerpt: excerpt ?? null,
        content,
        imageUrl: imageUrl || null,
        published: published ?? false,
        publishedAt: published ? new Date() : null,
      },
    }));
    return res.status(201).json(post);
  } catch (err) {
    next(err);
  }
}

async function updatePost(req, res, next) {
  try {
    const { title, excerpt, content, published } = req.body;
    const imageUrl = req.imageUrl ?? req.body.imageUrl ?? undefined;
    const data = {};

    const current = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: 'Publicación no encontrada' });

    // El título se edita libremente; el SLUG NO SE TOCA.
    //
    // El slug es la dirección pública del artículo: está indexado por Google,
    // compartido en WhatsApp y enlazado desde otras páginas. Regenerarlo en cada
    // corrección de título (una tilde, una errata) rompía todos esos enlaces en
    // silencio y sin redirección. La identidad del registro es el `id`; su
    // dirección se fija al crearlo y solo cambiaría por una acción explícita.
    if (title !== undefined) data.title = title;

    if (excerpt !== undefined) data.excerpt = excerpt ?? null;
    if (content !== undefined) data.content = content;
    // El archivo anterior no se borra aquí: se anota y se elimina cuando la
    // actualización haya confirmado. Borrarlo antes deja la fila apuntando a una
    // imagen inexistente si el update falla, y del disco no se vuelve.
    const filesToDelete = [];
    if (imageUrl !== undefined) {
      if (imageUrl === null) {
        if (current.imageUrl) filesToDelete.push(current.imageUrl);
      } else if (imageUrl && current.imageUrl && imageUrl !== current.imageUrl) {
        filesToDelete.push(current.imageUrl);
      }
      data.imageUrl = imageUrl || null;
    }

    if (published !== undefined) {
      data.published = published;
      data.publishedAt = published ? new Date() : null;
    }

    // Sin slug en `data` (ver arriba) la escritura no puede chocar con el índice
    // UNIQUE: se actualiza el registro identificado por su id, nada más.
    const post = await prisma.blogPost.update({ where: { id: req.params.id }, data });

    filesToDelete.forEach((file) => deleteUploadedFile(file));
    return res.json(post);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Publicación no encontrada' });
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    // `delete` devuelve la fila borrada, así que no hace falta leerla antes: una
    // query en vez de dos, sin ventana entre la lectura y el borrado. Y el orden
    // importa — el archivo se va solo después de que Postgres confirme. Si el
    // borrado falla, la imagen sigue en disco junto a su registro.
    const post = await prisma.blogPost.delete({ where: { id: req.params.id } });
    deleteUploadedFile(post.imageUrl);
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Publicación no encontrada' });
    next(err);
  }
}

async function uploadImage(req, res) {
  if (!req.imageUrl) {
    return res.status(400).json({ error: 'No se proporcionó ningún archivo de imagen' });
  }
  return res.json({ imageUrl: req.imageUrl });
}

module.exports = { listPosts, listAllPosts, getPost, createPost, updatePost, deletePost, uploadImage };
