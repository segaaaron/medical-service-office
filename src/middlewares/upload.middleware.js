const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { UPLOAD_MAX_SIZE_MB, WEBP_QUALITY } = require('../config/env');

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
  limits: { fileSize: UPLOAD_MAX_SIZE_MB * 1024 * 1024 },
});

/**
 * Comprime la imagen subida con sharp y la guarda en /uploads.
 * Convierte todo a WebP para máxima compresión sin pérdida visible de nitidez.
 * Popula req.imageUrl con la ruta pública resultante.
 */
async function compressAndSave(req, res, next) {
  if (!req.file) return next();

  try {
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex').slice(0, 16);
    const filename = `${Date.now()}-${hash}.webp`;
    const dest = path.join(UPLOAD_DIR, filename);

    await sharp(req.file.buffer)
      .rotate()
      .webp({ quality: WEBP_QUALITY, effort: 6 })
      .toFile(dest);

    req.imageUrl = `/uploads/${filename}`;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Elimina un archivo de /uploads dado su URL pública.
 * No lanza error si el archivo no existe o la URL no apunta a /uploads.
 */
function deleteUploadedFile(imageUrl) {
  if (!imageUrl) return;
  try {
    // Soporta tanto path relativo (/uploads/file.webp) como URL completa (http://host/uploads/file.webp)
    let pathname = imageUrl;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      pathname = new URL(imageUrl).pathname;
    }
    if (!pathname.startsWith('/uploads/')) return;
    const filename = path.basename(pathname);
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // URL inválida o error de fs — ignorar silenciosamente
  }
}

function mergeImageUrl(req, res, next) {
  if (req.imageUrl) {
    if (!req.body || typeof req.body !== 'object') req.body = {};
    req.body.imageUrl = req.imageUrl;
  }
  next();
}

module.exports = { upload, compressAndSave, deleteUploadedFile, mergeImageUrl };
