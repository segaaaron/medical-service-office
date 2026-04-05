function errorMiddleware(err, req, res, next) {
  // Log completo para diagnóstico
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
  console.error('Error name:', err.name);
  console.error('Error code:', err.code);
  console.error('Error message:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Errores de multer (archivo muy grande, tipo no permitido)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'La imagen no puede superar 10 MB' });
  }
  if (err.message && err.message.startsWith('Solo se permiten')) {
    return res.status(400).json({ error: err.message });
  }

  // Errores de parseo de JSON inválido (Express 5 los pasa aquí con status 400)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido en el body' });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(status).json({ error: message });
}

module.exports = { errorMiddleware };
