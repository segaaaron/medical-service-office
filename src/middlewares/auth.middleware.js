const { verifyAccessToken } = require('../services/auth.service');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

// Intenta autenticar pero no bloquea si no hay token.
// Si el token es válido, popula req.user; si no, simplemente continúa sin él.
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub };
    } catch {
      // token inválido o expirado — se ignora, la ruta sigue siendo pública
    }
  }
  next();
}

module.exports = { authenticate, optionalAuthenticate };
