require('dotenv').config();

const required = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'PORT',
];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '32h',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
  UPLOAD_MAX_SIZE_MB: parseInt(process.env.UPLOAD_MAX_SIZE_MB) || 10,
  WEBP_QUALITY: parseInt(process.env.WEBP_QUALITY) || 82,
  // Nitidez extra SOLO en estos dos caminos (NO global):
  // antes/después de tratamientos y galería "Nosotros" (congresos).
  WEBP_QUALITY_BEFORE_AFTER: parseInt(process.env.WEBP_QUALITY_BEFORE_AFTER) || 90,
  WEBP_QUALITY_GALLERY: parseInt(process.env.WEBP_QUALITY_GALLERY) || 95,
  // Cap de dimensiones de salida (lado mayor, px). Evita guardar fotos de cámara
  // a resolución original: corta peso/memoria sin pérdida visible en web.
  // No agranda imágenes más chicas (withoutEnlargement).
  WEBP_MAX_DIM: parseInt(process.env.WEBP_MAX_DIM) || 2560,
  WEBP_MAX_DIM_BEFORE_AFTER: parseInt(process.env.WEBP_MAX_DIM_BEFORE_AFTER) || 1600,
  // Tope de píxeles de ENTRADA (anti decompression-bomb). Una foto de 24MP ya
  // expande a ~290MB de RAM al decodificar; 50MP cubre cámaras reales (incl.
  // 8000x6000≈48MP) y rechaza buffers patológicos antes de reventar el heap.
  WEBP_MAX_INPUT_PIXELS: parseInt(process.env.WEBP_MAX_INPUT_PIXELS) || 50000000,
  // Galería /about: nº de imágenes decodificadas en paralelo (pool acotado).
  // 2 = paralelismo real con pico de RAM acotado (decode caro: ~cientos de MB
  // por imagen). Subir solo con más RAM disponible.
  ABOUT_GALLERY_CONCURRENCY: parseInt(process.env.ABOUT_GALLERY_CONCURRENCY) || 2,
  BODY_LIMIT: process.env.BODY_LIMIT || '1mb',
  LOGIN_RATE_LIMIT_MAX: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  LOGIN_RATE_LIMIT_WINDOW_MS: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  PAGINATION_DEFAULT_LIMIT: parseInt(process.env.PAGINATION_DEFAULT_LIMIT) || 20,
  PAGINATION_MAX_LIMIT: parseInt(process.env.PAGINATION_MAX_LIMIT) || 100,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ERROR_LOG_RETENTION_DAYS: parseInt(process.env.ERROR_LOG_RETENTION_DAYS) || 30,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173',
};
