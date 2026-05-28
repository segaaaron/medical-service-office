const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
const { upload, compressAndSave, deleteUploadedFile } = require('../middlewares/upload.middleware');
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

function parseValueJson(req, res, next) {
  if (req.body && typeof req.body.value === 'string') {
    try {
      req.body.value = JSON.parse(req.body.value);
    } catch {
      return res.status(400).json({ errors: [{ field: 'value', message: 'El valor debe ser un JSON válido' }] });
    }
  }
  next();
}

function cleanupOnError(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode >= 400 && req.imageUrl) deleteUploadedFile(req.imageUrl);
  });
  next();
}

// Public
router.get('/', listSiteContent);
router.get('/:key', getSiteContent);

// Protected
router.put('/', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, cleanupOnError, parseValueJson, validate(upsertSiteContentSchema), upsertSiteContent);
router.delete('/:key', authenticate, requireRole('ADMIN'), deleteSiteContent);

// Upload de imagen para secciones de contenido (ej. foto del doctor en treatmentsPage)
router.post('/upload-image', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, uploadImage);

module.exports = router;
