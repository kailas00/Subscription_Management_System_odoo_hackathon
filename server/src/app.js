import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiRouter } from './routes.js';
import { errorHandler, notFoundRoute } from './middleware/errorHandler.js';

export const app = express();
app.set('trust proxy', 'loopback'); // correct client IP behind the Vite proxy (rate limits)
app.use(helmet({ referrerPolicy: { policy: 'strict-origin-when-cross-origin' } }));
app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }); // API responses hold private data
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '2mb' })); // room for one product photo (resized in the browser to ~100 KB)

// Reject cross-site writes: a browser always sends Origin on POST/PATCH/PUT/DELETE.
const allowedOrigins = new Set([env.clientUrl, env.clientUrl.replace('localhost', '127.0.0.1'), `http://localhost:${env.port}`]);
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.has(origin)) return res.status(403).json({ error: { code: 'BAD_ORIGIN', message: 'Request blocked: unexpected origin' } });
  next();
});
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ data: { ok: true, time: new Date().toISOString() } }));
app.use('/api', apiRouter);
app.use(notFoundRoute);
app.use(errorHandler);
