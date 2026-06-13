const prisma = require('../services/prisma.service');
const { toSlug } = require('../utils/slug');
const { deleteUploadedFile } = require('../middlewares/upload.middleware');
const { parsePagination } = require('../utils/pagination');

async function listPosts(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const isAdmin = req.user?.role === 'ADMIN';
    const where = isAdmin ? {} : { published: true };

    const select = {
      id: true, title: true, slug: true, excerpt: true,
      content: true, imageUrl: true, published: true,
      publishedAt: true, createdAt: true,
    };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({ where, orderBy: { createdAt: 'desc' }, select, skip, take: limit }),
      prisma.blogPost.count({ where }),
    ]);

    return res.json({ data: posts, total, page, limit, totalPages: Math.ceil(total / limit) });
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

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: excerpt ?? null,
        content,
        imageUrl: imageUrl || null,
        published: published ?? false,
        publishedAt: published ? new Date() : null,
      },
    });
    return res.status(201).json(post);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe una publicación con ese título' });
    }
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

    if (title !== undefined) {
      data.title = title;
      // Only regenerate slug when the title text actually changed
      if (title !== current.title) {
        data.slug = toSlug(title);
      }
    }

    if (excerpt !== undefined) data.excerpt = excerpt ?? null;
    if (content !== undefined) data.content = content;
    if (imageUrl !== undefined) {
      if (imageUrl === null) {
        if (current.imageUrl) deleteUploadedFile(current.imageUrl);
      } else if (imageUrl && current.imageUrl && imageUrl !== current.imageUrl) {
        deleteUploadedFile(current.imageUrl);
      }
      data.imageUrl = imageUrl || null;
    }

    if (published !== undefined) {
      data.published = published;
      data.publishedAt = published ? new Date() : null;
    }

    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data,
    });
    return res.json(post);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Publicación no encontrada' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Ya existe una publicación con ese título' });
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const post = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (post) deleteUploadedFile(post.imageUrl);
    await prisma.blogPost.delete({ where: { id: req.params.id } });
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

module.exports = { listPosts, getPost, createPost, updatePost, deletePost, uploadImage };
