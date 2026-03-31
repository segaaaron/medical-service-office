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
const { createBlogPostSchema } = require('../schemas/index');

const router = Router();

// Public — anyone can view published posts
router.get('/', listPosts);
router.get('/:id', getPost);

// Protected — only authenticated admins
router.post('/', authenticate, validate(createBlogPostSchema), createPost);
router.put('/:id', authenticate, validate(createBlogPostSchema), updatePost);
router.delete('/:id', authenticate, deletePost);

module.exports = router;
