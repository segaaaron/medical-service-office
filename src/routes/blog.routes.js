const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} = require('../controllers/blog.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createBlogPostSchema, updateBlogPostSchema } = require('../schemas/index');

const router = Router();

// Public — allow the website to load blog posts without authentication
router.get('/', listPosts);
router.get('/:id', getPost);

// Protected — only authenticated admins
router.post('/', authenticate, validate(createBlogPostSchema), createPost);
router.put('/:id', authenticate, validate(updateBlogPostSchema), updatePost);
router.delete('/:id', authenticate, deletePost);

module.exports = router;
