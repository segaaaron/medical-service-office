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
// ISO 8601 datetime (e.g. 2024-06-15T10:30:00.000Z)
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const URL_RE = /^https?:\/\/.+/;

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
      errors.push(err('email', 'Must be a valid email address'));
    } else {
      out.email = data.email.trim().toLowerCase();
    }

    if (!isString(data.password) || data.password.length < 6) {
      errors.push(err('password', 'Password must be at least 6 characters'));
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
      errors.push(err('name', 'Name must be between 1 and 200 characters'));
    } else {
      out.name = data.name.trim();
    }

    if (!isNumber(data.price) || data.price <= 0) {
      errors.push(err('price', 'Price must be a positive number'));
    } else {
      out.price = data.price;
    }

    if (!isString(data.category) || data.category.trim().length < 1) {
      errors.push(err('category', 'Category is required'));
    } else {
      out.category = data.category.trim();
    }

    if (data.description !== undefined && data.description !== null) {
      if (!isString(data.description)) {
        errors.push(err('description', 'Description must be a string'));
      } else {
        out.description = data.description;
      }
    }

    if (data.longDescription !== undefined && data.longDescription !== null) {
      if (!isString(data.longDescription)) {
        errors.push(err('longDescription', 'Long description must be a string'));
      } else {
        out.longDescription = data.longDescription;
      }
    }

    if (data.imageUrl !== undefined && data.imageUrl !== null && data.imageUrl !== '') {
      if (!isString(data.imageUrl) || !URL_RE.test(data.imageUrl)) {
        errors.push(err('imageUrl', 'Image URL must be a valid http/https URL or empty string'));
      } else {
        out.imageUrl = data.imageUrl;
      }
    } else {
      out.imageUrl = data.imageUrl ?? '';
    }

    if (data.active !== undefined) {
      if (!isBoolean(data.active)) {
        errors.push(err('active', 'Active must be a boolean'));
      } else {
        out.active = data.active;
      }
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
      errors.push(err('title', 'Title must be between 1 and 300 characters'));
    } else {
      out.title = data.title.trim();
    }

    if (!isString(data.content) || data.content.trim().length < 1) {
      errors.push(err('content', 'Content is required'));
    } else {
      out.content = data.content;
    }

    if (data.excerpt !== undefined && data.excerpt !== null) {
      if (!isString(data.excerpt)) {
        errors.push(err('excerpt', 'Excerpt must be a string'));
      } else {
        out.excerpt = data.excerpt;
      }
    }

    if (data.imageUrl !== undefined && data.imageUrl !== null && data.imageUrl !== '') {
      if (!isString(data.imageUrl) || !URL_RE.test(data.imageUrl)) {
        errors.push(err('imageUrl', 'Image URL must be a valid http/https URL or empty string'));
      } else {
        out.imageUrl = data.imageUrl;
      }
    } else {
      out.imageUrl = data.imageUrl ?? '';
    }

    if (data.published !== undefined) {
      if (!isBoolean(data.published)) {
        errors.push(err('published', 'Published must be a boolean'));
      } else {
        out.published = data.published;
      }
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// createAppointmentSchema
// ---------------------------------------------------------------------------
const createAppointmentSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    if (!isString(data.patientName) || data.patientName.trim().length < 2 || data.patientName.trim().length > 100) {
      errors.push(err('patientName', 'Patient name must be between 2 and 100 characters'));
    } else {
      out.patientName = data.patientName.trim();
    }

    if (!isString(data.patientPhone) || data.patientPhone.trim().length < 6 || data.patientPhone.trim().length > 20) {
      errors.push(err('patientPhone', 'Patient phone must be between 6 and 20 characters'));
    } else {
      out.patientPhone = data.patientPhone.trim();
    }

    if (data.patientEmail !== undefined && data.patientEmail !== null && data.patientEmail !== '') {
      if (!isString(data.patientEmail) || !EMAIL_RE.test(data.patientEmail)) {
        errors.push(err('patientEmail', 'Patient email must be a valid email address or empty'));
      } else {
        out.patientEmail = data.patientEmail.trim().toLowerCase();
      }
    } else {
      out.patientEmail = data.patientEmail ?? '';
    }

    if (!isString(data.treatmentName) || data.treatmentName.trim().length < 1) {
      errors.push(err('treatmentName', 'Treatment name is required'));
    } else {
      out.treatmentName = data.treatmentName.trim();
    }

    if (data.notes !== undefined && data.notes !== null) {
      if (!isString(data.notes) || data.notes.length > 500) {
        errors.push(err('notes', 'Notes must be a string of at most 500 characters'));
      } else {
        out.notes = data.notes;
      }
    }

    if (data.scheduledAt !== undefined && data.scheduledAt !== null && data.scheduledAt !== '') {
      if (!isString(data.scheduledAt) || !DATETIME_RE.test(data.scheduledAt)) {
        errors.push(err('scheduledAt', 'scheduledAt must be an ISO 8601 datetime string or empty'));
      } else {
        out.scheduledAt = data.scheduledAt;
      }
    } else {
      out.scheduledAt = data.scheduledAt ?? '';
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

// ---------------------------------------------------------------------------
// upsertSiteContentSchema
// ---------------------------------------------------------------------------
const VALID_SITE_CONTENT_KEYS = ['main', 'branding', 'hero', 'value', 'course', 'presets', 'about', 'faqs', 'footer', 'promoBanner', 'promoPopup', 'freePDFs', 'freeResourcesForm', 'sectionHeaders'];

const upsertSiteContentSchema = {
  validate(data) {
    const errors = [];
    const out = {};

    if (!isString(data.key) || data.key.trim().length < 1 || data.key.trim().length > 100) {
      errors.push(err('key', 'Key must be a string between 1 and 100 characters'));
    } else {
      out.key = data.key.trim();
    }

    if (data.value === undefined || data.value === null) {
      errors.push(err('value', 'Value is required and must be a valid JSON object'));
    } else if (typeof data.value !== 'object') {
      errors.push(err('value', 'Value must be a JSON object'));
    } else {
      out.value = data.value;
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
        errors.push(err('title', 'Title must be between 1 and 300 characters'));
      } else {
        out.title = data.title.trim();
      }
    }

    if (data.content !== undefined && data.content !== null) {
      if (!isString(data.content) || data.content.trim().length < 1) {
        errors.push(err('content', 'Content must be a non-empty string'));
      } else {
        out.content = data.content;
      }
    }

    if (data.excerpt !== undefined && data.excerpt !== null) {
      if (!isString(data.excerpt)) {
        errors.push(err('excerpt', 'Excerpt must be a string'));
      } else {
        out.excerpt = data.excerpt;
      }
    }

    if (data.imageUrl !== undefined && data.imageUrl !== null) {
      if (data.imageUrl !== '' && (!isString(data.imageUrl) || !URL_RE.test(data.imageUrl))) {
        errors.push(err('imageUrl', 'Image URL must be a valid http/https URL or empty string'));
      } else {
        out.imageUrl = data.imageUrl;
      }
    }

    if (data.published !== undefined) {
      if (!isBoolean(data.published)) {
        errors.push(err('published', 'Published must be a boolean'));
      } else {
        out.published = data.published;
      }
    }

    if (Object.keys(out).length === 0 && errors.length === 0) {
      errors.push(err('body', 'At least one field must be provided for update'));
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

module.exports = {
  loginSchema,
  createTreatmentSchema,
  createBlogPostSchema,
  updateBlogPostSchema,
  createAppointmentSchema,
  upsertSiteContentSchema,
};
