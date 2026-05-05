const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/requireRole.middleware');
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

// Cuando el body llega como multipart/form-data, el campo `value` es un string JSON.
// Este middleware lo parsea a objeto para que el schema de validación lo acepte.
function parseValueJson(req, res, next) {
  if (req.body && typeof req.body.value === 'string') {
    try {
      req.body.value = JSON.parse(req.body.value);
    } catch {
      return res.status(400).json({ errors: [{ field: 'value', message: 'Value must be a valid JSON string' }] });
    }
  }
  next();
}

// Public — fetch content by key
router.get('/', listSiteContent);
router.get('/:key', getSiteContent);

// Protected — only authenticated admins
// upload.single('image') permite recibir multipart/form-data (igual que el blog)
router.put('/', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, parseValueJson, validate(upsertSiteContentSchema), upsertSiteContent);
router.delete('/:key', authenticate, requireRole('ADMIN'), deleteSiteContent);

// Upload de imagen para secciones de contenido (ej. foto del doctor en treatmentsPage)
router.post('/upload-image', authenticate, requireRole('ADMIN'), upload.single('image'), compressAndSave, uploadImage);

module.exports = router;
