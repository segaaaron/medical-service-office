/**
 * Manual validation schemas (no external dependency required).
 *
 * Each schema exposes a `validate(data)` method that returns:
 *   { success: true,  data: <sanitised object> }
 *   { success: false, errors: [{ field, message }] }
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isString(v) { return typeof v === 'string'; }
function isBoolean(v) { return typeof v === 'boolean'; }
function isNumber(v) { return typeof v === 'number' && !Number.isNaN(v); }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const URL_RE = /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+([\/\w\-.~:?#[\]@!$&'()*+,;=%]*)?$/;
const UPLOAD_URL_RE = /^\/uploads\/[\w.\-]+$/;

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively sanitize a parsed JSON value:
 * - Reject objects with __proto__, constructor, or prototype keys
 * - Reject functions
 * Returns { safe: true, value } or { safe: false, reason }
 */
function sanitizeJsonValue(val, depth = 0) {
  if (depth > 20) return { safe: false, reason: 'JSON nesting too deep' };
  if (val === null || val === undefined) return { safe: true, value: val };
  if (typeof val === 'function') return { safe: false, reason: 'Functions not allowed in JSON value' };
  if (typeof val !== 'object') return { safe: true, value: val };

  if (Array.isArray(val)) {
    const arr = [];
    for (const item of val) {
      const result = sanitizeJsonValue(item, depth + 1);
      if (!result.safe) return result;
      arr.push(result.value);
    }
    return { safe: true, value: arr };
  }

  const obj = {};
  for (const key of Object.keys(val)) {
    if (DANGEROUS_KEYS.has(key)) {
      return { safe: false, reason: `Forbidden key "${key}" in JSON value` };
    }
    const result = sanitizeJsonValue(val[key], depth + 1);
    if (!result.safe) return result;
    obj[key] = result.value;
  }
  return { safe: true, value: obj };
}

function err(field, message) {
  return { field, message };
}

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
const loginSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    if (!isString(data.email) || !EMAIL_RE.test(data.email)) {
      errors.push(err('email', 'Ingresa un correo electrónico válido'));
    } else {
      out.email = data.email.trim().toLowerCase();
    }

    if (!isString(data.password) || data.password.length < 1) {
      errors.push(err('password', 'La contraseña es requerida'));
    } else {
      out.password = data.password;
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// createTreatmentSchema
// ---------------------------------------------------------------------------
const createTreatmentSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    if (!isString(data.name) || data.name.trim().length < 1 || data.name.trim().length > 200) {
      errors.push(err('name', 'El nombre del tratamiento es requerido (máximo 200 caracteres)'));
    } else {
      out.name = data.name.trim();
    }

    if (data.tag !== undefined && data.tag !== null && data.tag !== '') {
      if (!isString(data.tag)) {
        errors.push(err('tag', 'La etiqueta debe ser texto'));
      } else {
        out.tag = data.tag.trim();
      }
    }

    if (!isString(data.description) || data.description.trim().length < 1) {
      errors.push(err('description', 'La descripción del tratamiento es requerida'));
    } else {
      out.description = data.description;
    }

    if (data.price !== undefined && data.price !== null && data.price !== '') {
      const parsed = parseFloat(data.price);
      if (Number.isNaN(parsed) || parsed < 0) {
        errors.push(err('price', 'El precio debe ser un número mayor o igual a cero'));
      } else {
        out.price = parsed;
      }
    }

    if (data.imageUrl !== undefined) {
      if (data.imageUrl === null || data.imageUrl === '') {
        out.imageUrl = null;
      } else if (!isString(data.imageUrl) || !UPLOAD_URL_RE.test(data.imageUrl)) {
        errors.push(err('imageUrl', 'imageUrl debe ser una ruta de /uploads/'));
      } else {
        out.imageUrl = data.imageUrl;
      }
    } else {
      out.imageUrl = data.imageUrl ?? null;
    }

    for (const field of ['beforeImageUrl', 'afterImageUrl']) {
      if (data[field] === undefined) continue;
      if (data[field] === null || data[field] === '') {
        out[field] = null;
      } else if (!isString(data[field]) || !UPLOAD_URL_RE.test(data[field])) {
        errors.push(err(field, `${field} debe ser una ruta de /uploads/`));
      } else {
        out[field] = data[field];
      }
    }

    if (data.active !== undefined) {
      if (data.active === true || data.active === 'true') {
        out.active = true;
      } else if (data.active === false || data.active === 'false') {
        out.active = false;
      } else {
        errors.push(err('active', 'active debe ser un booleano'));
      }
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// updateTreatmentSchema
// ---------------------------------------------------------------------------
const updateTreatmentSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    if (data.name !== undefined && data.name !== null) {
      if (!isString(data.name) || data.name.trim().length < 1 || data.name.trim().length > 200) {
        errors.push(err('name', 'El nombre debe tener entre 1 y 200 caracteres'));
      } else {
        out.name = data.name.trim();
      }
    }

    if (data.tag !== undefined && data.tag !== null && data.tag !== '') {
      if (!isString(data.tag)) {
        errors.push(err('tag', 'La etiqueta debe ser texto'));
      } else {
        out.tag = data.tag.trim();
      }
    } else if (data.tag === '' || data.tag === null) {
      out.tag = null;
    }

    if (data.description !== undefined && data.description !== null) {
      if (!isString(data.description)) {
        errors.push(err('description', 'La descripción debe ser texto'));
      } else {
        out.description = data.description;
      }
    }

    if (data.price !== undefined) {
      if (data.price === null || data.price === '') {
        out.price = null;
      } else {
        const parsed = parseFloat(data.price);
        if (Number.isNaN(parsed) || parsed < 0) {
          errors.push(err('price', 'El precio debe ser un número mayor o igual a cero'));
        } else {
          out.price = parsed;
        }
      }
    }

    if (data.imageUrl !== undefined) {
      if (data.imageUrl === null || data.imageUrl === '') {
        out.imageUrl = null;
      } else if (!isString(data.imageUrl) || !UPLOAD_URL_RE.test(data.imageUrl)) {
        errors.push(err('imageUrl', 'imageUrl debe ser una ruta de /uploads/'));
      } else {
        out.imageUrl = data.imageUrl;
      }
    }

    for (const field of ['beforeImageUrl', 'afterImageUrl']) {
      if (data[field] === undefined) continue;
      if (data[field] === null || data[field] === '') {
        out[field] = null;
      } else if (!isString(data[field]) || !UPLOAD_URL_RE.test(data[field])) {
        errors.push(err(field, `${field} debe ser una ruta de /uploads/`));
      } else {
        out[field] = data[field];
      }
    }

    if (data.active !== undefined) {
      if (data.active === true || data.active === 'true') {
        out.active = true;
      } else if (data.active === false || data.active === 'false') {
        out.active = false;
      } else {
        errors.push(err('active', 'El estado debe ser verdadero o falso'));
      }
    }

    if (Object.keys(out).length === 0 && errors.length === 0) {
      errors.push(err('body', 'Debes enviar al menos un campo para actualizar'));
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// createBlogPostSchema
// ---------------------------------------------------------------------------
const createBlogPostSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    if (!isString(data.title) || data.title.trim().length < 1 || data.title.trim().length > 300) {
      errors.push(err('title', 'El título es requerido (máximo 300 caracteres)'));
    } else {
      out.title = data.title.trim();
    }

    if (!isString(data.content) || data.content.trim().length < 1) {
      errors.push(err('content', 'El contenido de la publicación es requerido'));
    } else {
      out.content = data.content;
    }

    if (data.excerpt !== undefined && data.excerpt !== null) {
      if (!isString(data.excerpt)) {
        errors.push(err('excerpt', 'El resumen debe ser texto'));
      } else {
        out.excerpt = data.excerpt;
      }
    }

    if (data.imageUrl !== undefined) {
      if (data.imageUrl === null || data.imageUrl === '') {
        out.imageUrl = null;
      } else if (!isString(data.imageUrl) || !UPLOAD_URL_RE.test(data.imageUrl)) {
        errors.push(err('imageUrl', 'imageUrl debe ser una ruta de /uploads/'));
      } else {
        out.imageUrl = data.imageUrl;
      }
    } else {
      out.imageUrl = data.imageUrl ?? '';
    }

    if (data.published !== undefined) {
      if (data.published === true || data.published === 'true') {
        out.published = true;
      } else if (data.published === false || data.published === 'false') {
        out.published = false;
      } else {
        errors.push(err('published', 'El campo publicado debe ser verdadero o falso'));
      }
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};


// ---------------------------------------------------------------------------
// upsertSiteContentSchema
// ---------------------------------------------------------------------------
const upsertSiteContentSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    if (!isString(data.key) || data.key.trim().length < 1 || data.key.trim().length > 100) {
      errors.push(err('key', 'La clave del contenido es requerida (máximo 100 caracteres)'));
    } else {
      out.key = data.key.trim();
    }

    if (data.value === undefined || data.value === null) {
      errors.push(err('value', 'El contenido es requerido y debe ser un objeto JSON válido'));
    } else if (typeof data.value !== 'object') {
      errors.push(err('value', 'El contenido debe ser un objeto JSON'));
    } else {
      const sanitized = sanitizeJsonValue(data.value);
      if (!sanitized.safe) {
        errors.push(err('value', sanitized.reason));
      } else {
        out.value = sanitized.value;
      }
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// updateBlogPostSchema — all fields optional for partial updates
// ---------------------------------------------------------------------------
const updateBlogPostSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    if (data.title !== undefined && data.title !== null) {
      if (!isString(data.title) || data.title.trim().length < 1 || data.title.trim().length > 300) {
        errors.push(err('title', 'El título debe tener entre 1 y 300 caracteres'));
      } else {
        out.title = data.title.trim();
      }
    }

    if (data.content !== undefined && data.content !== null) {
      if (!isString(data.content) || data.content.trim().length < 1) {
        errors.push(err('content', 'El contenido no puede estar vacío'));
      } else {
        out.content = data.content;
      }
    }

    if (data.excerpt !== undefined && data.excerpt !== null) {
      if (!isString(data.excerpt)) {
        errors.push(err('excerpt', 'El resumen debe ser texto'));
      } else {
        out.excerpt = data.excerpt;
      }
    }

    if (data.imageUrl !== undefined) {
      if (data.imageUrl === null || data.imageUrl === '') {
        out.imageUrl = null;
      } else if (!isString(data.imageUrl) || !UPLOAD_URL_RE.test(data.imageUrl)) {
        errors.push(err('imageUrl', 'imageUrl debe ser una ruta de /uploads/'));
      } else {
        out.imageUrl = data.imageUrl;
      }
    }

    if (data.published !== undefined && data.published !== null) {
      if (data.published === true || data.published === 'true') {
        out.published = true;
      } else if (data.published === false || data.published === 'false') {
        out.published = false;
      } else {
        errors.push(err('published', 'El campo publicado debe ser verdadero o falso'));
      }
    }

    if (Object.keys(out).length === 0 && errors.length === 0) {
      errors.push(err('body', 'Debes enviar al menos un campo para actualizar'));
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// upsertContactSchema
// ---------------------------------------------------------------------------
const upsertContactSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    if (!isString(data.whatsappNumber) || data.whatsappNumber.trim().length < 1) {
      errors.push(err('whatsappNumber', 'El número de WhatsApp es requerido'));
    } else {
      out.whatsappNumber = data.whatsappNumber.trim();
    }

    if (!isString(data.whatsappUrl) || !URL_RE.test(data.whatsappUrl.trim())) {
      errors.push(err('whatsappUrl', 'El enlace de WhatsApp debe ser una URL válida'));
    } else {
      out.whatsappUrl = data.whatsappUrl.trim();
    }

    if (!isString(data.phone) || data.phone.trim().length < 1) {
      errors.push(err('phone', 'El número de teléfono es requerido'));
    } else {
      out.phone = data.phone.trim();
    }

    if (!isString(data.instagramUsername) || data.instagramUsername.trim().length < 1) {
      errors.push(err('instagramUsername', 'El usuario de Instagram es requerido'));
    } else {
      out.instagramUsername = data.instagramUsername.trim();
    }

    if (!isString(data.instagramUrl) || !URL_RE.test(data.instagramUrl.trim())) {
      errors.push(err('instagramUrl', 'El enlace de Instagram debe ser una URL válida'));
    } else {
      out.instagramUrl = data.instagramUrl.trim();
    }

    if (!isString(data.facebookName) || data.facebookName.trim().length < 1) {
      errors.push(err('facebookName', 'El nombre de la página de Facebook es requerido'));
    } else {
      out.facebookName = data.facebookName.trim();
    }

    if (!isString(data.facebookUrl) || !URL_RE.test(data.facebookUrl.trim())) {
      errors.push(err('facebookUrl', 'El enlace de Facebook debe ser una URL válida'));
    } else {
      out.facebookUrl = data.facebookUrl.trim();
    }

    if (!isString(data.mondayFridayHours) || data.mondayFridayHours.trim().length < 1) {
      errors.push(err('mondayFridayHours', 'El horario de lunes a viernes es requerido'));
    } else {
      out.mondayFridayHours = data.mondayFridayHours.trim();
    }

    if (!isString(data.saturdayHours) || data.saturdayHours.trim().length < 1) {
      errors.push(err('saturdayHours', 'El horario del sábado es requerido'));
    } else {
      out.saturdayHours = data.saturdayHours.trim();
    }

    if (!isString(data.sundayStatus) || data.sundayStatus.trim().length < 1) {
      errors.push(err('sundayStatus', 'El estado del domingo es requerido'));
    } else {
      out.sundayStatus = data.sundayStatus.trim();
    }

    if (!isString(data.locationDescription) || data.locationDescription.trim().length < 1) {
      errors.push(err('locationDescription', 'La descripción de la ubicación es requerida'));
    } else {
      out.locationDescription = data.locationDescription.trim();
    }

    // Coordenadas del mapa (opcionales)
    if (data.latitude !== undefined && data.latitude !== null && data.latitude !== '') {
      const lat = Number(data.latitude);
      if (!isNumber(lat) || lat < -90 || lat > 90) {
        errors.push(err('latitude', 'La latitud debe ser un número entre -90 y 90'));
      } else {
        out.latitude = lat;
      }
    }

    if (data.longitude !== undefined && data.longitude !== null && data.longitude !== '') {
      const lng = Number(data.longitude);
      if (!isNumber(lng) || lng < -180 || lng > 180) {
        errors.push(err('longitude', 'La longitud debe ser un número entre -180 y 180'));
      } else {
        out.longitude = lng;
      }
    }

    if (data.mapsUrl !== undefined && data.mapsUrl !== null && data.mapsUrl !== '') {
      if (!isString(data.mapsUrl) || !URL_RE.test(data.mapsUrl.trim())) {
        errors.push(err('mapsUrl', 'El enlace de Maps debe ser una URL válida'));
      } else {
        out.mapsUrl = data.mapsUrl.trim();
      }
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// upsertAboutUsSchema
// ---------------------------------------------------------------------------
const ABOUT_US_STRING_FIELDS = [
  'sectionLabel', 'doctorName',
  'descriptionDoc',
  'experienceBadgeValue', 'experienceBadgeLabel',
  'stat1Value', 'stat1Label',
  'stat2Value', 'stat2Label',
  'stat3Value', 'stat3Label',
  'whyChooseUsLabel', 'whyChooseUsTitle', 'whyChooseUsDescription',
  'feature1Title', 'feature1Description',
  'feature2Title', 'feature2Description',
  'feature3Title', 'feature3Description',
  'feature4Title', 'feature4Description',
];

const upsertAboutUsSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    for (const field of ABOUT_US_STRING_FIELDS) {
      if (data[field] !== undefined && data[field] !== null) {
        if (!isString(data[field])) {
          errors.push(err(field, `El campo ${field} debe ser texto`));
        } else {
          out[field] = data[field];
        }
      }
    }

    if (data.imageUrl !== undefined) {
      if (data.imageUrl === null || data.imageUrl === '') {
        out.imageUrl = null;
      } else if (!isString(data.imageUrl) || !UPLOAD_URL_RE.test(data.imageUrl)) {
        errors.push(err('imageUrl', 'imageUrl debe ser una ruta de /uploads/'));
      } else {
        out.imageUrl = data.imageUrl;
      }
    }

    // Galería "Nosotros": array ordenado de rutas /uploads/, máx 10.
    // El middleware ya la reconstruyó por posición; aquí solo se valida.
    if (data.gallery !== undefined) {
      if (!Array.isArray(data.gallery)) {
        errors.push(err('gallery', 'gallery debe ser un array'));
      } else if (data.gallery.length > 10) {
        errors.push(err('gallery', 'gallery admite máximo 10 imágenes'));
      } else if (!data.gallery.every((u) => isString(u) && UPLOAD_URL_RE.test(u))) {
        errors.push(err('gallery', 'cada elemento de gallery debe ser una ruta de /uploads/'));
      } else {
        out.gallery = data.gallery;
      }
    }

    if (Object.keys(out).length === 0 && errors.length === 0) {
      errors.push(err('body', 'Al menos un campo debe ser proporcionado'));
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// upsertFooterSchema
// ---------------------------------------------------------------------------
const FOOTER_STRING_FIELDS = [
  'doctorName', 'specialty', 'description',
  'whatsappUrl', 'facebookUrl', 'instagramUrl',
  'copyrightText', 'designedByText',
];
const FOOTER_JSON_FIELDS = ['facialTreatments', 'bodyTreatments', 'officeLinks', 'legalLinks'];

const upsertFooterSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    for (const field of FOOTER_STRING_FIELDS) {
      if (data[field] !== undefined && data[field] !== null) {
        if (!isString(data[field])) {
          errors.push(err(field, `${field} debe ser texto`));
        } else {
          out[field] = data[field];
        }
      }
    }

    for (const field of FOOTER_JSON_FIELDS) {
      if (data[field] !== undefined && data[field] !== null) {
        if (typeof data[field] !== 'object') {
          errors.push(err(field, `${field} debe ser un arreglo o objeto JSON`));
        } else {
          const sanitized = sanitizeJsonValue(data[field]);
          if (!sanitized.safe) {
            errors.push(err(field, sanitized.reason));
          } else {
            out[field] = sanitized.value;
          }
        }
      }
    }

    if (Object.keys(out).length === 0 && errors.length === 0) {
      errors.push(err('body', 'Al menos un campo debe ser proporcionado'));
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// upsertPromoBannerSchema
// ---------------------------------------------------------------------------
const PROMO_BANNER_STRING_FIELDS = [
  'tag', 'badges', 'title', 'highlightedText', 'description',
  'doctorName', 'location', 'whatsappText', 'whatsappUrl',
  'dismissText',
];

const upsertPromoBannerSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    for (const field of PROMO_BANNER_STRING_FIELDS) {
      if (data[field] !== undefined && data[field] !== null) {
        if (!isString(data[field])) {
          errors.push(err(field, `${field} debe ser texto`));
        } else {
          out[field] = data[field];
        }
      }
    }

    if (data.imageUrl !== undefined) {
      if (data.imageUrl === null || data.imageUrl === '') {
        out.imageUrl = null;
      } else if (!isString(data.imageUrl) || !UPLOAD_URL_RE.test(data.imageUrl)) {
        errors.push(err('imageUrl', 'imageUrl debe ser una ruta de /uploads/'));
      } else {
        out.imageUrl = data.imageUrl;
      }
    }

    if (data.active !== undefined) {
      if (data.active === true || data.active === 'true') {
        out.active = true;
      } else if (data.active === false || data.active === 'false') {
        out.active = false;
      } else {
        errors.push(err('active', 'active debe ser un booleano'));
      }
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// upsertHomeSchema
// ---------------------------------------------------------------------------
const HOME_STRING_FIELDS = [
  'specialties', 'doctorName', 'subtitle', 'description',
  'highlightedText', 'btn1Text', 'btn2Text',
  'stat1Value', 'stat1Label',
  'stat2Value', 'stat2Label',
  'stat3Value', 'stat3Label',
  'faqSectionLabel', 'faqTitle',
];

const upsertHomeSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    for (const field of HOME_STRING_FIELDS) {
      if (data[field] !== undefined && data[field] !== null) {
        if (!isString(data[field])) {
          errors.push(err(field, `${field} debe ser texto`));
        } else {
          out[field] = data[field];
        }
      }
    }

    if (data.faqs !== undefined && data.faqs !== null) {
      if (!Array.isArray(data.faqs)) {
        errors.push(err('faqs', 'faqs debe ser un arreglo JSON'));
      } else {
        const sanitized = sanitizeJsonValue(data.faqs);
        if (!sanitized.safe) {
          errors.push(err('faqs', sanitized.reason));
        } else {
          out.faqs = sanitized.value;
        }
      }
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// createUserSchema / updateUserSchema
// ---------------------------------------------------------------------------
const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

const createUserSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    if (!isString(data.email) || !EMAIL_RE.test(data.email)) {
      errors.push(err('email', 'Debe ser un email válido'));
    } else {
      out.email = data.email.trim().toLowerCase();
    }

    if (!isString(data.name) || data.name.trim().length < 1 || data.name.trim().length > 100) {
      errors.push(err('name', 'El nombre es requerido (máx 100 caracteres)'));
    } else {
      out.name = data.name.trim();
    }

    if (!isString(data.password) || !STRONG_PASSWORD_RE.test(data.password)) {
      errors.push(err('password', 'La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'));
    } else {
      out.password = data.password;
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

const updateUserSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    if (data.email !== undefined) {
      if (!isString(data.email) || !EMAIL_RE.test(data.email)) {
        errors.push(err('email', 'Debe ser un email válido'));
      } else {
        out.email = data.email.trim().toLowerCase();
      }
    }

    if (data.name !== undefined) {
      if (!isString(data.name) || data.name.trim().length < 1 || data.name.trim().length > 100) {
        errors.push(err('name', 'El nombre debe tener entre 1 y 100 caracteres'));
      } else {
        out.name = data.name.trim();
      }
    }

    if (data.password !== undefined) {
      if (!isString(data.password) || !STRONG_PASSWORD_RE.test(data.password)) {
        errors.push(err('password', 'La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'));
      } else {
        out.password = data.password;
      }
    }

    if (Object.keys(out).length === 0 && errors.length === 0) {
      errors.push(err('body', 'Al menos un campo debe ser proporcionado: email, nombre o contraseña'));
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};


// ---------------------------------------------------------------------------
// refreshTokenSchema
// ---------------------------------------------------------------------------
const refreshTokenSchema = {
  validate(data) {
    const errors = [];
    const out = {};
    if (!isString(data.refreshToken) || data.refreshToken.trim().length < 1) {
      errors.push(err('refreshToken', 'refreshToken es requerido'));
    } else {
      out.refreshToken = data.refreshToken.trim();
    }
    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// createInviteSchema — admin crea la invitación de reseña
// ---------------------------------------------------------------------------
const createInviteSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    if (!isString(data.patient_name) || data.patient_name.trim().length < 2 || data.patient_name.trim().length > 100) {
      errors.push(err('patient_name', 'El nombre es requerido (2 a 100 caracteres)'));
    } else {
      out.patient_name = data.patient_name.trim();
    }

    if (!isString(data.patient_lastname) || data.patient_lastname.trim().length < 2 || data.patient_lastname.trim().length > 100) {
      errors.push(err('patient_lastname', 'El apellido es requerido (2 a 100 caracteres)'));
    } else {
      out.patient_lastname = data.patient_lastname.trim();
    }

    if (data.email !== undefined && data.email !== null && data.email !== '') {
      if (!isString(data.email) || data.email.trim().length > 150 || !EMAIL_RE.test(data.email.trim())) {
        errors.push(err('email', 'Correo electrónico inválido (máximo 150 caracteres)'));
      } else {
        out.email = data.email.trim();
      }
    } else {
      out.email = null;
    }

    if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
      if (!isString(data.phone) || data.phone.trim().length > 20) {
        errors.push(err('phone', 'Teléfono inválido (máximo 20 caracteres)'));
      } else {
        out.phone = data.phone.trim();
      }
    } else {
      out.phone = null;
    }

    if (errors.length) {
      return {
        success: false,
        errors,
        formatted: {
          error: 'VALIDATION_ERROR',
          fields: Object.fromEntries(errors.map(e => [e.field, e.message])),
        },
      };
    }

    return { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// submitInviteSchema — paciente envía su reseña vía link único
// ---------------------------------------------------------------------------
const submitInviteSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    const rating = Number(data.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.push(err('rating', 'Requerido — debe ser un entero entre 1 y 5'));
    } else {
      out.rating = rating;
    }

    if (!isString(data.body) || data.body.trim().length < 20 || data.body.trim().length > 800) {
      errors.push(err('body', 'Mínimo 20 caracteres, máximo 800'));
    } else {
      out.body = data.body.trim();
    }

    if (data.treatment !== undefined && data.treatment !== null && data.treatment !== '') {
      if (!isString(data.treatment) || data.treatment.trim().length > 150) {
        errors.push(err('treatment', 'Máximo 150 caracteres'));
      } else {
        out.treatment = data.treatment.trim();
      }
    } else {
      out.treatment = null;
    }

    if (errors.length) {
      return {
        success: false,
        errors,
        formatted: {
          error: 'VALIDATION_ERROR',
          fields: Object.fromEntries(errors.map(e => [e.field, e.message])),
        },
      };
    }

    return { success: true, data: out };
  },
};

module.exports = {
  loginSchema,
  refreshTokenSchema,
  createUserSchema,
  updateUserSchema,
  createTreatmentSchema,
  updateTreatmentSchema,
  createBlogPostSchema,
  updateBlogPostSchema,
  upsertSiteContentSchema,
  upsertContactSchema,
  upsertAboutUsSchema,
  upsertFooterSchema,
  upsertPromoBannerSchema,
  upsertHomeSchema,
  createInviteSchema,
  submitInviteSchema,
};
