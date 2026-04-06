const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { upload, compressAndSave } = require('../middlewares/upload.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { upsertSiteContentSchema } = require('../schemas/index');
const {
  getSiteContent,
  listSiteContent,
  upsertSiteContent,
  deleteSiteContent,
  uploadImage,
} = require('../controllers/site-content.controller');

const router = Router();

// Public — fetch content by key
router.get('/', listSiteContent);
router.get('/:key', getSiteContent);

// Protected — only authenticated admins
router.put('/', authenticate, validate(upsertSiteContentSchema), upsertSiteContent);
router.delete('/:key', authenticate, deleteSiteContent);

// Upload de imagen para secciones de contenido (ej. foto del doctor en treatmentsPage)
router.post('/upload-image', authenticate, upload.single('image'), compressAndSave, uploadImage);

module.exports = router;
