const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { upload, compressAndSave } = require('../middlewares/upload.middleware');
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

router.get('/', listPosts);
router.get('/:id', getPost);

// Protected — only authenticated admins
router.post('/', authenticate, upload.single('image'), compressAndSave, validate(createBlogPostSchema), createPost);
router.put('/:id', authenticate, upload.single('image'), compressAndSave, validate(updateBlogPostSchema), updatePost);
router.delete('/:id', authenticate, deletePost);

// Subida y compresión de imagen
router.post('/upload-image', authenticate, upload.single('image'), compressAndSave, uploadImage);

module.exports = router;
