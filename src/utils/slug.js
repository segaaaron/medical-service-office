/**
 * Converts a text string into a URL-safe slug.
 * Handles accented characters and special symbols.
 */
function toSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

module.exports = { toSlug };
