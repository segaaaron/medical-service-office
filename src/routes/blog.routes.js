const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { optionalAuth } = require('../middlewares/optionalAuth.middleware');
const { upload, compressAndSave, mergeImageUrl } = require('../middlewares/upload.middleware');
const {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  uploadImage,
} = require('../controllers/blog.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createBlogPostSchema, updateBlogPostSchema } = require('../schemas/index');

const router = Router();

router.get('/', optionalAuth, listPosts);
router.get('/:id', optionalAuth, getPost);

router.post('/', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, mergeImageUrl, validate(createBlogPostSchema), createPost);
router.put('/:id', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, mergeImageUrl, validate(updateBlogPostSchema), updatePost);
router.delete('/:id', authenticate, requireRole('ADMIN'), deletePost);

router.post('/upload-image', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, uploadImage);

module.exports = router;
