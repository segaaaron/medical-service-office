const isProduction = process.env.NODE_ENV === 'production';
const { UPLOAD_MAX_SIZE_MB } = require('../config/env');
const logger = require('../config/logger');

function errorMiddleware(err, req, res, next) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: `La imagen no puede superar ${UPLOAD_MAX_SIZE_MB} MB` });
  }
  if (err.message && err.message.startsWith('Solo se permiten')) {
    return res.status(400).json({ error: 'Solo se permiten imágenes en formato JPEG, PNG, WebP o GIF' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud contiene JSON inválido' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'El recurso solicitado no fue encontrado' });
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Ya existe un registro con ese valor' });
  }
  if (err.code === 'P2003') {
    return res.status(409).json({ error: 'No se puede completar la operación porque el registro tiene datos relacionados' });
  }
  if (err.code === 'P2023' || err.name === 'PrismaClientValidationError') {
    return res.status(400).json({ error: 'El identificador proporcionado no tiene un formato válido' });
  }

  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    logger.error({ err, method: req.method, url: req.originalUrl, ip: req.ip }, 'Unhandled server error');
  }
  const message = isProduction && status === 500
    ? 'Ocurrió un error inesperado. Por favor intenta de nuevo más tarde.'
    : (err.message || 'Ocurrió un error inesperado. Por favor intenta de nuevo más tarde.');
  return res.status(status).json({ error: message });
}

module.exports = { errorMiddleware };
