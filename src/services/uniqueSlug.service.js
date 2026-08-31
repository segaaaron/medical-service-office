const crypto = require('crypto');

/**
 * Resolución de slug único sin bloquear al usuario.
 *
 * El `id` (UUID) es la identidad real de cada registro. El `slug` existe solo
 * para las URLs públicas, así que dos registros pueden llamarse igual: lo que
 * no puede repetirse es su dirección web. Esta capa resuelve la colisión sola
 * en lugar de devolver un 409 y dejar al editor sin saber contra qué chocó.
 *
 * Estrategia: se intenta el slug base; ante colisión se prueban sufijos
 * legibles (-2, -3) y, si la carrera continúa, un sufijo aleatorio que la corta
 * de raíz. No hay SELECT previo de comprobación: eso sería TOCTOU (dos escrituras
 * simultáneas leen "libre" y una falla igual). Se confía en el índice UNIQUE de
 * Postgres como única fuente de verdad y se reacciona a su error.
 *
 * Coste: 1 escritura en el caso normal. O(1) conexiones del pool en todo momento
 * (los intentos son secuenciales, nunca en paralelo), y el tope de intentos
 * garantiza que una anomalía no encole trabajo indefinido sobre el pool.
 */

// Intentos totales, incluido el primero. Dos con sufijo legible y dos aleatorios:
// tras cuatro colisiones seguidas, el problema ya no es el nombre.
const MAX_SLUG_ATTEMPTS = 5;
// A partir de este intento se abandona el contador legible y se usa entropía.
const RANDOM_SUFFIX_FROM_ATTEMPT = 4;

function randomSuffix() {
  return crypto.randomBytes(3).toString('hex'); // 6 hex → 16.7M combinaciones
}

// attempt 1 → base · 2 → base-2 · 3 → base-3 · 4+ → base-<hex>
function slugForAttempt(baseSlug, attempt) {
  if (attempt === 1) return baseSlug;
  if (attempt < RANDOM_SUFFIX_FROM_ATTEMPT) return `${baseSlug}-${attempt}`;
  return `${baseSlug}-${randomSuffix()}`;
}

function isSlugCollision(err) {
  if (!err || err.code !== 'P2002') return false;
  const target = err.meta?.target;
  // Prisma reporta el/los campos del índice violado. Si no informa cuál fue
  // (según conector y versión puede venir vacío), se asume el slug: es el único
  // UNIQUE no generado por el sistema en estos modelos.
  if (target == null) return true;
  const fields = Array.isArray(target) ? target : [target];
  return fields.some((f) => String(f).toLowerCase().includes('slug'));
}

/**
 * Ejecuta `run(slug)` reintentando con un slug distinto mientras Postgres
 * rechace por colisión de slug. Cualquier otro error se propaga tal cual: esta
 * capa resuelve nombres repetidos, no oculta fallos.
 *
 * @param {string} baseSlug slug derivado del título/nombre
 * @param {(slug: string) => Promise<T>} run escritura de Prisma a ejecutar
 * @returns {Promise<T>}
 */
async function createWithUniqueSlug(baseSlug, run) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
    try {
      return await run(slugForAttempt(baseSlug, attempt));
    } catch (err) {
      if (!isSlugCollision(err)) throw err;
      lastError = err;
    }
  }
  throw lastError;
}

module.exports = {
  createWithUniqueSlug,
  MAX_SLUG_ATTEMPTS,
};
