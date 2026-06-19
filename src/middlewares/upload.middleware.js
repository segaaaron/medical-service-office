const multer = require('multer');
const sharp = require('sharp');

// Defensa de memoria a nivel proceso (casos reales de OOM con sharp en prod):
//   - cache(false): tareas one-off de upload, no retener bitmaps en caché.
//   - concurrency(1): 1 thread libvips POR operación. Bajo nuestro pool acotado
//     ya hay paralelismo controlado; dejar que cada sharp abra N threads (=cores)
//     multiplica RAM y fragmenta el heap (issue lovell/sharp#2607), agravado en
//     musl/Alpine. 1 thread/op = picos de memoria predecibles y acotados.
sharp.cache(false);
sharp.concurrency(1);
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const crypto = require('crypto');
const {
  UPLOAD_MAX_SIZE_MB,
  WEBP_QUALITY,
  WEBP_QUALITY_BEFORE_AFTER,
  WEBP_QUALITY_GALLERY,
  WEBP_MAX_DIM,
  WEBP_MAX_DIM_BEFORE_AFTER,
  WEBP_MAX_INPUT_PIXELS,
  ABOUT_GALLERY_CONCURRENCY,
} = require('../config/env');

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
 *
 * Defensas de memoria/rendimiento:
 *   - `limitInputPixels`: rechaza buffers patológicos (decompression bomb) ANTES
 *     de decodificar → no revienta la RAM del proceso.
 *   - `failOn: 'error'`: aborta ante datos corruptos en vez de seguir.
 *   - `resize(... withoutEnlargement)`: capa el lado mayor a `maxDim` (no agranda
 *     fotos chicas). Corta peso/latencia/storage sin pérdida visible en web.
 */
async function saveWebpFromBuffer(buffer, quality = WEBP_QUALITY, maxDim = WEBP_MAX_DIM) {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  // Sufijo aleatorio: evita colisión cuando dos campos (ej. antes/después) traen
  // el MISMO contenido (mismo hash) en el mismo milisegundo.
  const rand = crypto.randomBytes(4).toString('hex');
  const filename = `${Date.now()}-${hash}-${rand}.webp`;
  const dest = path.join(UPLOAD_DIR, filename);

  await sharp(buffer, { limitInputPixels: WEBP_MAX_INPUT_PIXELS, failOn: 'error' })
    .rotate()
    .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toFile(dest);

  return `/uploads/${filename}`;
}

/**
 * Ejecuta `fn` sobre cada item con un POOL ACOTADO de `limit` en vuelo.
 * Ni secuencial (lento) ni todo-en-paralelo (desborda CPU/RAM): N workers
 * consumen una cola compartida. Devuelve resultados en el MISMO orden de entrada.
 */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  let firstError = null;
  async function worker() {
    // Tras un fallo, deja de tomar trabajo nuevo, pero NO corta a los workers
    // que ya tienen un item en vuelo: se espera a que todos terminen (Promise.all
    // nunca rechaza aquí) para que cada archivo escrito quede registrado antes de
    // propagar el error → la limpieza ve todo, no quedan huérfanos.
    while (cursor < items.length && !firstError) {
      const i = cursor++;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        if (!firstError) firstError = err;
        return;
      }
    }
  }
  const n = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: n }, worker));
  if (firstError) throw firstError;
  return results;
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
// `quality` opcional: antes/después usan nitidez extra; la portada queda en el
// default global (82). Solo estos dos caminos suben de calidad, no es global.
const TREATMENT_IMAGE_FIELDS = [
  { file: 'image', url: 'imageUrl' },
  { file: 'beforeImage', url: 'beforeImageUrl', quality: WEBP_QUALITY_BEFORE_AFTER, maxDim: WEBP_MAX_DIM_BEFORE_AFTER },
  { file: 'afterImage', url: 'afterImageUrl', quality: WEBP_QUALITY_BEFORE_AFTER, maxDim: WEBP_MAX_DIM_BEFORE_AFTER },
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

    for (const { file, url, quality, maxDim } of TREATMENT_IMAGE_FIELDS) {
      const uploaded = req.files && req.files[file] && req.files[file][0];
      if (uploaded) {
        const saved = await saveWebpFromBuffer(uploaded.buffer, quality, maxDim);
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

// ---------------------------------------------------------------------------
// Galería "Nosotros" (colage de congresos) dentro de /about. Hasta 10 fotos.
// El dashboard manda SIEMPRE multipart con:
//   - image                 → imagen principal del doctor (calidad default)
//   - galleryImage{0..9}     → File nueva para la posición i (nitidez de galería)
//   - galleryUrl{0..9}       → URL existente a conservar en la posición i
// Se reconstruye `gallery` por orden de posición, sin huecos, máx 10.
// ---------------------------------------------------------------------------
const ABOUT_GALLERY_MAX = 10;

const ABOUT_UPLOAD_FIELDS = [
  { name: 'image', maxCount: 1 },
  ...Array.from({ length: ABOUT_GALLERY_MAX }, (_, i) => ({
    name: `galleryImage${i}`,
    maxCount: 1,
  })),
];

const uploadAboutImages = upload.fields(ABOUT_UPLOAD_FIELDS);

// Normaliza una URL conservada a ruta /uploads/<archivo>: el front puede mandar
// la URL absoluta (proxy) o la ruta relativa; ambas deben quedar como /uploads/.
function toUploadsPath(value) {
  if (typeof value !== 'string' || !value) return null;
  let pathname = value;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      pathname = new URL(value).pathname;
    } catch {
      return null;
    }
  }
  // El front sirve las imágenes conservadas vía proxy /api/uploads/<archivo>
  // (evita bloqueo CORP en el navegador). Normalizar de vuelta a /uploads/.
  if (pathname.startsWith('/api/uploads/')) pathname = pathname.slice(4);
  return pathname.startsWith('/uploads/') ? pathname : null;
}

/**
 * Procesa imagen principal + galería de /about.
 *   - image (File)            → req.imageUrl (calidad default global)
 *   - galleryImage{i} (File)  → comprime con nitidez de galería, ocupa pos i
 *   - galleryUrl{i} (string)  → conserva la URL existente en pos i
 * Si NO llega ninguna señal de galería, NO toca `gallery` (no la borra).
 * Acumula urls nuevas en req.uploadedUrls para limpieza ante error.
 */
async function compressAboutImages(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object') req.body = {};
    req.uploadedUrls = req.uploadedUrls || [];
    const files = req.files || {};

    // Imagen principal: misma semántica que el resto (calidad default).
    const mainFile = files.image && files.image[0];
    if (mainFile) {
      req.imageUrl = await saveWebpFromBuffer(mainFile.buffer);
      req.uploadedUrls.push(req.imageUrl);
    }

    // ¿Llega alguna señal de galería? (File nueva o URL a conservar en cualquier pos)
    let hasGallerySignal = false;
    for (let i = 0; i < ABOUT_GALLERY_MAX; i++) {
      if (
        (files[`galleryImage${i}`] && files[`galleryImage${i}`][0]) ||
        req.body[`galleryUrl${i}`] !== undefined
      ) {
        hasGallerySignal = true;
        break;
      }
    }

    if (hasGallerySignal) {
      const slots = Array.from({ length: ABOUT_GALLERY_MAX }, (_, i) => i);

      // Pool acotado: procesa las imágenes nuevas con `ABOUT_GALLERY_CONCURRENCY`
      // en vuelo (ni secuencial-lento ni 10-en-paralelo-desbordado). Cada archivo
      // guardado se registra en req.uploadedUrls AL INSTANTE: si otra posición
      // falla, cleanupOnError borra TODO lo ya escrito (cero huérfanos, cero
      // pérdida). El resultado se coloca por índice → orden de posición intacto.
      const resolved = await mapWithConcurrency(slots, ABOUT_GALLERY_CONCURRENCY, async (i) => {
        const gFile = files[`galleryImage${i}`] && files[`galleryImage${i}`][0];
        if (gFile) {
          const saved = await saveWebpFromBuffer(gFile.buffer, WEBP_QUALITY_GALLERY);
          req.uploadedUrls.push(saved);
          return saved;
        }
        return toUploadsPath(req.body[`galleryUrl${i}`]);
      });

      for (let i = 0; i < ABOUT_GALLERY_MAX; i++) {
        delete req.body[`galleryUrl${i}`]; // no son columnas; evitar confusión
      }

      req.body.gallery = resolved.filter(Boolean); // ordenado, sin huecos, máx 10
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
  uploadAboutImages,
  compressAboutImages,
  mapWithConcurrency,
  toUploadsPath,
};
