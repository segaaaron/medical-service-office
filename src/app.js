const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const routes = require('./routes/index');
const { errorMiddleware } = require('./middlewares/error.middleware');
const prisma = require('./services/prisma.service');
const { BODY_LIMIT, ALLOWED_ORIGINS } = require('./config/env');

const app = express();

// ── Trust proxy (required when running behind Dokploy/nginx) ─────────────────
app.set('trust proxy', 1);

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ── CORS ────────────────────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';


const corsOptions = isProduction
  ? {
      origin: (origin, callback) => {
        const allowedOrigins = (process.env.CORS_ORIGIN || '')
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean);

        // Allow requests with no origin (e.g. server-to-server) or matching origins
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin '${origin}' not allowed`));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }
  : {
      origin: (origin, callback) => {
        const devOrigins = ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
        if (!origin || devOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin '${origin}' not allowed`));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    };

app.use(cors(corsOptions));
app.options('/{*path}', cors(corsOptions)); // pre-flight for all routes

// ── Archivos estáticos (imágenes subidas) ────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1y',
  immutable: true,
}));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: BODY_LIMIT }));


// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', timestamp: new Date().toISOString() });
  }
});

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
