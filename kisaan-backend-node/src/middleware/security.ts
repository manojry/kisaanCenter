import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import { Application, Request, Response, RequestHandler } from 'express';
import { env } from '../config/env';

// Build CORS origins list
function buildCorsOrigins(): string[] | RegExp[] {
  const defaults = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080'
  ];
  const extra = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  return Array.from(new Set([...defaults, ...extra]));
}

export interface SecurityOptions {
  enableRateLimit?: boolean;
  requestsPerWindow?: number;
  windowMs?: number;
}

export function applySecurity(app: Application, opts: SecurityOptions = {}) {
  const {
    enableRateLimit = env.NODE_ENV === 'production',
    requestsPerWindow = 300,
    windowMs = 15 * 60 * 1000
  } = opts;

  // Helmet baseline
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  const corsOrigins = buildCorsOrigins();
  const corsOptions: CorsOptions = {
    origin: corsOrigins,
    credentials: true,
  };
  app.use(cors(corsOptions));

  // Compression (optional if dependency installed)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const compression = require('compression');
    app.use(compression());
  } catch {
    app.get('/__warn/compression', (_req, res) => res.json({ warning: 'compression module not installed' }));
  }

  // Body parsers (centralized) - large enough for file uploads but not excessive
  app.use((require('express').json({ limit: '10mb' })) as RequestHandler);
  app.use((require('express').urlencoded({ extended: true, limit: '10mb' })) as RequestHandler);

  // Rate limiting (simple in-memory). For clustering or multiple instances, replace with Redis store.
  if (enableRateLimit) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const rateLimit = require('express-rate-limit');
      app.use('/api/', rateLimit({
        windowMs,
        max: requestsPerWindow,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req: Request, res: Response) => {
          (req as any).log?.warn({ ip: req.ip }, 'rate limit exceeded');
          return res.status(429).json({ success: false, error: 'Too many requests, please try again later.' });
        }
      }));
    } catch {
      app.get('/__warn/ratelimit', (_req, res) => res.json({ warning: 'express-rate-limit module not installed' }));
    }
  }
}
