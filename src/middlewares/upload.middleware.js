const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Almacena en memoria para procesarla con sharp antes de escribir a disco
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, png, webp, gif)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máximo de entrada
});

/**
 * Comprime la imagen subida con sharp y la guarda en /uploads.
 * Convierte todo a WebP para máxima compresión sin pérdida visible de nitidez.
 * Popula req.imageUrl con la ruta pública resultante.
 */
async function compressAndSave(req, res, next) {
  if (!req.file) return next();

  try {
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const dest = path.join(UPLOAD_DIR, filename);

    await sharp(req.file.buffer)
      .webp({ quality: 82, effort: 6 }) // 82% calidad WebP — nitidez alta, peso mínimo
      .withMetadata()                   // preserva orientación EXIF
      .toFile(dest);

    req.imageUrl = `/uploads/${filename}`;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, compressAndSave };
