const { verifyAccessToken } = require('../services/auth.service');
const prisma = require('../services/prisma.service');

async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true },
    });
    if (user) {
      req.user = { id: user.id, role: user.role };
    }
  } catch {
    // Token inválido — continuar como visitante sin autenticar
  }
  next();
}

module.exports = { optionalAuth };
