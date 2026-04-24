const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const routes = require('./routes/index');
const { errorMiddleware } = require('./middlewares/error.middleware');

const app = express();

// ── Trust proxy (required when running behind Dokploy/nginx) ─────────────────
app.set('trust proxy', 1);

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
      origin: (origin, callback) => {
        const devOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean);
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
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Public GET rate limiter ──────────────────────────────────────────────────
const publicGetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
// Apply to all public GET endpoints
app.use('/api/treatments', publicGetLimiter);
app.use('/api/blog', publicGetLimiter);
app.use('/api/contact', publicGetLimiter);
app.use('/api/home', publicGetLimiter);
app.use('/api/about', publicGetLimiter);
app.use('/api/footer', publicGetLimiter);
app.use('/api/promo-banner', publicGetLimiter);
app.use('/api/site-content', publicGetLimiter);

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
