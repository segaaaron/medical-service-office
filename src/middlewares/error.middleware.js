function errorMiddleware(err, req, res, next) {
  console.error(err);
  // Errores de multer (archivo muy grande, tipo no permitido)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'La imagen no puede superar 10 MB' });
  }
  if (err.message && err.message.startsWith('Solo se permiten')) {
    return res.status(400).json({ error: err.message });
  }
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(status).json({ error: message });
}

module.exports = { errorMiddleware };
