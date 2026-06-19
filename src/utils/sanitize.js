/**
 * Sanitiza payloads antes de persistirlos en error_logs.
 *
 * Contexto: oficina médica. El body/query/params pueden contener PII de
 * pacientes (nombres, email, teléfono, documento) y secretos (passwords,
 * tokens). Redactamos esas claves conservando la ESTRUCTURA del payload para
 * poder debuggear qué servicio falló y con qué forma de datos, sin filtrar
 * información sensible.
 *
 * Además acotamos profundidad, longitud de strings y nº de claves/elementos
 * para impedir que un payload gigante infle la fila (TOAST) o sature la DB.
 */

const REDACTED = '[REDACTED]';
const TRUNCATED = '…[TRUNCATED]';

// Claves cuyo VALOR se redacta (match case-insensitive por substring).
const SENSITIVE_KEYS = [
  'password', 'pass', 'pwd',
  'token', 'accesstoken', 'refreshtoken', 'authorization', 'auth',
  'secret', 'apikey', 'api_key', 'jwt', 'cookie', 'session',
  'email', 'correo',
  'phone', 'telefono', 'celular', 'movil',
  'dni', 'document', 'documento', 'ssn', 'nif', 'passport', 'pasaporte',
  'patientname', 'patient_name', 'patientlastname', 'patient_lastname',
  'firstname', 'lastname', 'nombre', 'apellido', 'fullname',
  'address', 'direccion',
  'card', 'tarjeta', 'creditcard', 'cvv', 'iban',
  'birthdate', 'fechanacimiento', 'dob',
];

const MAX_DEPTH = 5;
const MAX_STRING = 2_000;
const MAX_KEYS = 60;
const MAX_ARRAY = 50;

function isSensitiveKey(key) {
  const k = String(key).toLowerCase().replace(/[_\-\s]/g, '');
  return SENSITIVE_KEYS.some((s) => k.includes(s.replace(/[_\-\s]/g, '')));
}

function sanitizeValue(value, depth) {
  if (value === null || value === undefined) return value ?? null;

  const t = typeof value;
  if (t === 'string') {
    return value.length > MAX_STRING ? value.slice(0, MAX_STRING) + TRUNCATED : value;
  }
  if (t === 'number' || t === 'boolean') return value;
  if (t === 'bigint') return value.toString();
  if (t === 'function' || t === 'symbol') return undefined;

  if (depth >= MAX_DEPTH) return '[Object]';

  if (Array.isArray(value)) {
    const out = value.slice(0, MAX_ARRAY).map((v) => sanitizeValue(v, depth + 1));
    if (value.length > MAX_ARRAY) out.push(`…(+${value.length - MAX_ARRAY} more)`);
    return out;
  }

  if (t === 'object') {
    const out = {};
    let count = 0;
    for (const key of Object.keys(value)) {
      if (count >= MAX_KEYS) { out['…'] = '[TRUNCATED_KEYS]'; break; }
      out[key] = isSensitiveKey(key) ? REDACTED : sanitizeValue(value[key], depth + 1);
      count++;
    }
    return out;
  }

  return null;
}

/**
 * Devuelve una copia profunda sanitizada del objeto dado, o null si está vacío.
 * Nunca lanza: ante cualquier fallo retorna un marcador, no rompe el request.
 * @param {unknown} obj
 * @returns {object|null}
 */
function sanitizePayload(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return { value: sanitizeValue(obj, 0) };
  if (Array.isArray(obj)) {
    return obj.length === 0 ? null : sanitizeValue(obj, 0);
  }
  if (Object.keys(obj).length === 0) return null;
  try {
    return sanitizeValue(obj, 0);
  } catch {
    return { _error: 'no_se_pudo_sanitizar_el_payload' };
  }
}

module.exports = { sanitizePayload, isSensitiveKey, REDACTED };
