import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { sanitizeRequest } from './middlewares/sanitize.middleware.js';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { meRouter } from './modules/me/me.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { matchesRouter } from './modules/matches/matches.routes.js';
import { rankingRouter } from './modules/ranking/ranking.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { settingsRouter } from './modules/settings/settings.routes.js';
import { notFoundMiddleware, errorMiddleware } from './middlewares/error.middleware.js';
import path from 'path';
import fs from 'fs';

export const app = express();

// Behind proxies to get client IP
app.set('trust proxy', 1);

// Disable x-powered-by header
app.disable('x-powered-by');

app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter (basic abuse protection)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Sanitize incoming requests to remove sensitive fields that must never be set by clients
app.use(sanitizeRequest);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/admin/users', usersRouter);
app.use('/api/admin/matches', matchesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ranking', rankingRouter);
app.use('/api/settings', settingsRouter);

// Serve frontend SPA if built in workspace (optional fallback)
try {
  const frontDist = path.join(process.cwd(), 'frontend', 'dist');
  if (fs.existsSync(frontDist)) {
    app.use(express.static(frontDist));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontDist, 'index.html'));
    });
  }
} catch (err) {
  // best-effort: ignore errors here
}

app.use(notFoundMiddleware);
app.use(errorMiddleware);
