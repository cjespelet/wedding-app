import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';

import { apiRouter } from './web/api-router.js';

export async function createServer() {
  const app = express();

  // Helmet en modo relajado para desarrollo:
  // - Sin CORP (crossOriginResourcePolicy: false) para permitir imágenes desde otro origen
  // - Sin CSP (contentSecurityPolicy: false) porque el CSP por defecto bloquea img-src a 'self'
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: false,
    }),
  );
  const defaultCorsOrigins = [
    'http://localhost',
    'http://localhost:4200',
    'http://localhost:4300',
    'http://localhost:8100', // Ionic dev server
    'http://192.168.0.107:8080', // PWA local (celu mismo Wi‑Fi)
    ...(process.env.NODE_ENV === 'production'
      ? ['https://jesiyjavier.com.ar', 'https://www.jesiyjavier.com.ar']
      : []),
  ];
  const envCorsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  const allowedOrigins = [...new Set([...defaultCorsOrigins, ...envCorsOrigins])];
  const devLanOrigin =
    /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        if (process.env.NODE_ENV !== 'production' && devLanOrigin.test(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api', apiRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'El archivo supera el máximo permitido (5MB)' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof Error) {
      const code = (err as Error & { code?: string }).code;
      if (code === 'INVALID_IMAGE_TYPE') {
        return res.status(400).json({ error: err.message });
      }
    }
    // basic error handler
    // eslint-disable-next-line no-console
    console.error(err);
    if (res.headersSent) {
      next(err);
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

