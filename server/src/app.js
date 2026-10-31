import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiRouter } from './routes.js';
import { errorHandler, notFoundRoute } from './middleware/errorHandler.js';

export const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ data: { ok: true, time: new Date().toISOString() } }));
app.use('/api', apiRouter);
app.use(notFoundRoute);
app.use(errorHandler);
