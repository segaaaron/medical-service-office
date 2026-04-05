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

// Merge uploaded image URL into req.body so the validation schema can see it
function mergeImageUrl(req, res, next) {
  if (req.imageUrl) {
    if (!req.body || typeof req.body !== 'object') req.body = {};
    req.body.imageUrl = req.imageUrl;
  }
  next();
}

// Protected — only authenticated admins
router.post('/', authenticate, upload.single('image'), compressAndSave, mergeImageUrl, validate(createBlogPostSchema), createPost);
router.put('/:id', authenticate, upload.single('image'), compressAndSave, mergeImageUrl, validate(updateBlogPostSchema), updatePost);
router.delete('/:id', authenticate, deletePost);

// Subida y compresión de imagen
router.post('/upload-image', authenticate, upload.single('image'), compressAndSave, uploadImage);

module.exports = router;
