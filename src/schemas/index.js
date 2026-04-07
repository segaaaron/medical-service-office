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

    if (data.tag !== undefined && data.tag !== null && data.tag !== '') {
      if (!isString(data.tag)) {
        errors.push(err('tag', 'Tag must be a string'));
      } else {
        out.tag = data.tag.trim();
      }
    }

    if (!isString(data.description) || data.description.trim().length < 1) {
      errors.push(err('description', 'Description is required'));
    } else {
      out.description = data.description;
    }

    if (data.price !== undefined && data.price !== null && data.price !== '') {
      const parsed = parseFloat(data.price);
      if (Number.isNaN(parsed) || parsed < 0) {
        errors.push(err('price', 'Price must be a non-negative number'));
      } else {
        out.price = parsed;
      }
    }

    if (data.imageUrl !== undefined && data.imageUrl !== null && data.imageUrl !== '') {
      if (!isString(data.imageUrl)) {
        errors.push(err('imageUrl', 'Image URL must be a string'));
      } else {
        out.imageUrl = data.imageUrl;
      }
    } else {
      out.imageUrl = data.imageUrl ?? null;
    }

    if (data.active !== undefined) {
      if (data.active === true || data.active === 'true') {
        out.active = true;
      } else if (data.active === false || data.active === 'false') {
        out.active = false;
      } else {
        errors.push(err('active', 'Active must be a boolean'));
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
        errors.push(err('name', 'Name must be between 1 and 200 characters'));
      } else {
        out.name = data.name.trim();
      }
    }

    if (data.tag !== undefined && data.tag !== null && data.tag !== '') {
      if (!isString(data.tag)) {
        errors.push(err('tag', 'Tag must be a string'));
      } else {
        out.tag = data.tag.trim();
      }
    } else if (data.tag === '' || data.tag === null) {
      out.tag = null;
    }

    if (data.description !== undefined && data.description !== null) {
      if (!isString(data.description)) {
        errors.push(err('description', 'Description must be a string'));
      } else {
        out.description = data.description;
      }
    }

    if (data.price !== undefined && data.price !== null && data.price !== '') {
      const parsed = parseFloat(data.price);
      if (Number.isNaN(parsed) || parsed < 0) {
        errors.push(err('price', 'Price must be a non-negative number'));
      } else {
        out.price = parsed;
      }
    }

    if (data.imageUrl !== undefined && data.imageUrl !== null) {
      if (!isString(data.imageUrl)) {
        errors.push(err('imageUrl', 'Image URL must be a string'));
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
        errors.push(err('active', 'Active must be a boolean'));
      }
    }

    if (Object.keys(out).length === 0 && errors.length === 0) {
      errors.push(err('body', 'At least one field must be provided for update'));
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
      if (!isString(data.imageUrl)) {
        errors.push(err('imageUrl', 'Image URL must be a string'));
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
        errors.push(err('published', 'Published must be a boolean'));
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
const VALID_SITE_CONTENT_KEYS = ['main', 'branding', 'hero', 'value', 'course', 'presets', 'about', 'faqs', 'footer', 'promoBanner', 'promoPopup', 'freePDFs', 'freeResourcesForm', 'sectionHeaders', 'treatmentsPage'];

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
      if (!isString(data.imageUrl)) {
        errors.push(err('imageUrl', 'Image URL must be a string'));
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
        errors.push(err('published', 'Published must be a boolean'));
      }
    }

    if (Object.keys(out).length === 0 && errors.length === 0) {
      errors.push(err('body', 'At least one field must be provided for update'));
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
      errors.push(err('whatsappNumber', 'WhatsApp number is required'));
    } else {
      out.whatsappNumber = data.whatsappNumber.trim();
    }

    if (!isString(data.whatsappUrl) || data.whatsappUrl.trim().length < 1) {
      errors.push(err('whatsappUrl', 'WhatsApp URL is required'));
    } else {
      out.whatsappUrl = data.whatsappUrl.trim();
    }

    if (!isString(data.phone) || data.phone.trim().length < 1) {
      errors.push(err('phone', 'Phone number is required'));
    } else {
      out.phone = data.phone.trim();
    }

    if (!isString(data.instagramUsername) || data.instagramUsername.trim().length < 1) {
      errors.push(err('instagramUsername', 'Instagram username is required'));
    } else {
      out.instagramUsername = data.instagramUsername.trim();
    }

    if (!isString(data.instagramUrl) || data.instagramUrl.trim().length < 1) {
      errors.push(err('instagramUrl', 'Instagram URL is required'));
    } else {
      out.instagramUrl = data.instagramUrl.trim();
    }

    if (!isString(data.facebookName) || data.facebookName.trim().length < 1) {
      errors.push(err('facebookName', 'Facebook page name is required'));
    } else {
      out.facebookName = data.facebookName.trim();
    }

    if (!isString(data.facebookUrl) || data.facebookUrl.trim().length < 1) {
      errors.push(err('facebookUrl', 'Facebook URL is required'));
    } else {
      out.facebookUrl = data.facebookUrl.trim();
    }

    if (!isString(data.mondayFridayHours) || data.mondayFridayHours.trim().length < 1) {
      errors.push(err('mondayFridayHours', 'Monday–Friday hours are required'));
    } else {
      out.mondayFridayHours = data.mondayFridayHours.trim();
    }

    if (!isString(data.saturdayHours) || data.saturdayHours.trim().length < 1) {
      errors.push(err('saturdayHours', 'Saturday hours are required'));
    } else {
      out.saturdayHours = data.saturdayHours.trim();
    }

    if (!isString(data.sundayStatus) || data.sundayStatus.trim().length < 1) {
      errors.push(err('sundayStatus', 'Sunday status is required'));
    } else {
      out.sundayStatus = data.sundayStatus.trim();
    }

    if (!isString(data.locationDescription) || data.locationDescription.trim().length < 1) {
      errors.push(err('locationDescription', 'Location description is required'));
    } else {
      out.locationDescription = data.locationDescription.trim();
    }

    return errors.length ? { success: false, errors } : { success: true, data: out };
  },
};

module.exports = {
  loginSchema,
  createTreatmentSchema,
  updateTreatmentSchema,
  createBlogPostSchema,
  updateBlogPostSchema,
  createAppointmentSchema,
  upsertSiteContentSchema,
  upsertContactSchema,
};
