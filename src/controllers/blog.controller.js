const prisma = require('../services/prisma.service');
const { toSlug } = require('../utils/slug');

async function listPosts(req, res, next) {
  try {
    const where = {};

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        imageUrl: true,
        published: true,
        publishedAt: true,
        createdAt: true,
      },
    });
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
    if (!post) return res.status(404).json({ error: 'Post not found' });
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
    const isPublished = published === true;

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: excerpt ?? null,
        content,
        imageUrl: imageUrl || null,
        published: isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });
    return res.status(201).json(post);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A post with this title already exists' });
    }
    next(err);
  }
}

async function updatePost(req, res, next) {
  try {
    const { title, excerpt, content, published } = req.body;
    const imageUrl = req.imageUrl ?? req.body.imageUrl ?? undefined;
    const data = {};

    // Always fetch current post to validate existence and support publishedAt logic
    const current = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: 'Post not found' });

    if (title !== undefined) {
      data.title = title;
      // Only regenerate slug when the title text actually changed
      if (title !== current.title) {
        data.slug = toSlug(title);
      }
    }

    if (excerpt !== undefined) data.excerpt = excerpt ?? null;
    if (content !== undefined) data.content = content;
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null;

    if (published !== undefined) {
      data.published = published;
      if (data.published && !current.publishedAt) {
        data.publishedAt = new Date();
      } else if (!data.published) {
        data.publishedAt = null;
      }
    }

    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data,
    });
    return res.json(post);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Post not found' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'A post with this title already exists' });
    if (err.code === 'P2023' || err.name === 'PrismaClientValidationError') {
      return res.status(400).json({ error: 'Invalid post ID format' });
    }
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Post not found' });
    next(err);
  }
}

async function uploadImage(req, res) {
  return res.json({ imageUrl: req.imageUrl });
}

module.exports = { listPosts, getPost, createPost, updatePost, deletePost, uploadImage };
