require('./src/config/env');
const app = require('./src/app');
const { PORT } = require('./src/config/env');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully…`);

  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed.');

    try {
      await prisma.$disconnect();
      console.log('Prisma client disconnected.');
    } catch (err) {
      console.error('Error disconnecting Prisma:', err);
    }

    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Graceful shutdown timed out — forcing exit.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
