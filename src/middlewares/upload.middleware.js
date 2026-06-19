const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
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
 * Comprime un buffer de imagen a WebP, lo guarda en /uploads y devuelve la
 * ruta pública resultante. Núcleo reutilizable por los middlewares de imagen.
 */
async function saveWebpFromBuffer(buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  // Sufijo aleatorio: evita colisión cuando dos campos (ej. antes/después) traen
  // el MISMO contenido (mismo hash) en el mismo milisegundo.
  const rand = crypto.randomBytes(4).toString('hex');
  const filename = `${Date.now()}-${hash}-${rand}.webp`;
  const dest = path.join(UPLOAD_DIR, filename);

  await sharp(buffer)
    .rotate()
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(dest);

  return `/uploads/${filename}`;
}

/**
 * Comprime la imagen subida con sharp y la guarda en /uploads.
 * Convierte todo a WebP para máxima compresión sin pérdida visible de nitidez.
 * Popula req.imageUrl con la ruta pública resultante.
 */
async function compressAndSave(req, res, next) {
  if (!req.file) return next();

  try {
    req.imageUrl = await saveWebpFromBuffer(req.file.buffer);
    next();
  } catch (err) {
    next(err);
  }
}

// Campos de imagen de Treatment: archivo subido (multer) → columna *_url.
const TREATMENT_IMAGE_FIELDS = [
  { file: 'image', url: 'imageUrl' },
  { file: 'beforeImage', url: 'beforeImageUrl' },
  { file: 'afterImage', url: 'afterImageUrl' },
];

// Acepta hasta 1 archivo por cada campo de imagen del tratamiento.
const uploadTreatmentImages = upload.fields(
  TREATMENT_IMAGE_FIELDS.map(({ file }) => ({ name: file, maxCount: 1 }))
);

/**
 * Procesa las 3 imágenes de Treatment (portada/antes/después) con la MISMA
 * semántica que `image`, escribiendo el resultado en req.body.<*ImageUrl>:
 *   - archivo presente  → comprime+guarda, setea la url nueva
 *   - string vacío ("")  → marca "" (el controller lo interpretará como borrar)
 *   - campo ausente      → deja el *_url como undefined (el controller no toca)
 * Acumula las urls recién creadas en req.uploadedUrls para limpieza ante error.
 */
async function compressTreatmentImages(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object') req.body = {};
    req.uploadedUrls = req.uploadedUrls || [];

    for (const { file, url } of TREATMENT_IMAGE_FIELDS) {
      const uploaded = req.files && req.files[file] && req.files[file][0];
      if (uploaded) {
        const saved = await saveWebpFromBuffer(uploaded.buffer);
        req.body[url] = saved;
        req.uploadedUrls.push(saved);
      } else if (req.body[file] === '') {
        req.body[url] = ''; // señal explícita de borrado
      }
      delete req.body[file]; // el nombre del File no es columna; evitar confusión
    }
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
    let pathname = imageUrl;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      pathname = new URL(imageUrl).pathname;
    }
    if (!pathname.startsWith('/uploads/')) return;
    const filePath = path.join(UPLOAD_DIR, path.basename(pathname));
    fsp.unlink(filePath).catch((err) => {
      if (err.code !== 'ENOENT') console.error(`[upload] unlink failed: ${err.message}`);
    });
  } catch {
    // URL inválida — ignorar
  }
}

function mergeImageUrl(req, res, next) {
  if (req.imageUrl) {
    if (!req.body || typeof req.body !== 'object') req.body = {};
    req.body.imageUrl = req.imageUrl;
  }
  next();
}

module.exports = {
  upload,
  compressAndSave,
  deleteUploadedFile,
  mergeImageUrl,
  saveWebpFromBuffer,
  uploadTreatmentImages,
  compressTreatmentImages,
};
