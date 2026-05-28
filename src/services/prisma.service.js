const { PrismaClient } = require('@prisma/client');

const isDev = process.env.NODE_ENV !== 'production';

const prisma = new PrismaClient({
  log: isDev
    ? [{ emit: 'event', level: 'query' }, { emit: 'event', level: 'warn' }]
    : [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }],
});

if (isDev) {
  prisma.$on('query', (e) => {
    if (e.duration > 100) {
      console.warn(`[prisma] slow query ${e.duration}ms — ${e.query}`);
    }
  });
}

module.exports = prisma;
