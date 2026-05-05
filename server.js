require('./src/config/env');
const app = require('./src/app');
const { PORT } = require('./src/config/env');
const prisma = require('./src/services/prisma.service');
const logger = require('./src/config/logger');

const server = app.listen(PORT, () => {
  logger.info({ event: 'server_start', port: PORT }, `Server running on port ${PORT}`);
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
  logger.info({ event: 'shutdown_start', signal }, `${signal} received — shutting down gracefully…`);

  server.close(async () => {
    logger.info({ event: 'http_closed' }, 'HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info({ event: 'prisma_disconnected' }, 'Prisma client disconnected.');
    } catch (err) {
      logger.error({ event: 'prisma_disconnect_error', err }, 'Error disconnecting Prisma.');
    }

    process.exit(0);
  });

  setTimeout(() => {
    logger.error({ event: 'shutdown_timeout' }, 'Graceful shutdown timed out — forcing exit.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
