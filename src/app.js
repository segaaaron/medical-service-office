const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes/index');
const { errorMiddleware } = require('./middlewares/error.middleware');

const app = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

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
      origin: true, // allow all origins in development
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    };

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // pre-flight for all routes

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Request logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`;
    // Use combined-like format in production, dev-like otherwise
    if (isProduction) {
      const ip = req.ip || req.socket.remoteAddress || '-';
      console.log(`${ip} - ${line}`);
    } else {
      console.log(line);
    }
  });
  next();
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
