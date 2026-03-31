/**
 * Validation middleware factory.
 * Accepts a schema object produced by src/schemas/index.js and validates req.body.
 * Returns 400 with error details on failure; calls next() and sets req.body to
 * the parsed/sanitised data on success.
 */
function validate(schema) {
  return function validationMiddleware(req, res, next) {
    const result = schema.validate(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.errors,
      });
    }

    req.body = result.data;
    return next();
  };
}

module.exports = { validate };
