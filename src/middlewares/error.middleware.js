const isProduction = process.env.NODE_ENV === 'production';
const { UPLOAD_MAX_SIZE_MB } = require('../config/env');

function errorMiddleware(err, req, res, next) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: `La imagen no puede superar ${UPLOAD_MAX_SIZE_MB} MB` });
  }
  if (err.message && err.message.startsWith('Solo se permiten')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido en el body' });
  }

  const status = err.status || err.statusCode || 500;
  const message = isProduction && status === 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error');
  return res.status(status).json({ error: message });
}

module.exports = { errorMiddleware };
