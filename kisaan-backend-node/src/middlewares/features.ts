import { Request, Response, NextFunction } from 'express';
import { FeatureService } from '../services/featureService';
import { failureCode } from '../shared/http/respond';
import { ErrorCodes } from '../shared/errors/errorCodes';

// Cache simple in-memory for request lifetime (very basic)
declare global {
  // eslint-disable-next-line no-var
  var __featureCache: Map<number, { ts: number; data: Awaited<ReturnType<typeof FeatureService.getEffectiveFeatures>> }>; // node global
}

if (!global.__featureCache) global.__featureCache = new Map();

const CACHE_MS = 30_000; // 30s window

export async function loadFeatures(req: Request, _res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return next();
    const now = Date.now();
    const cached = global.__featureCache.get(userId);
    if (cached && (now - cached.ts) < CACHE_MS) {
      (req as any).features = cached.data;
      return next();
    }
    const data = await FeatureService.getEffectiveFeatures(userId);
    global.__featureCache.set(userId, { ts: now, data });
    (req as any).features = data;
    next();
  } catch (e) { next(e); }
}

export function requireFeature(code: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const features = (req as any).features?.features;
    if (!features) return failureCode(res, 401, ErrorCodes.AUTH_REQUIRED, undefined, 'Auth required');
    if (!features[code]) {
      return failureCode(res, 403, ErrorCodes.ACCESS_DENIED, { feature: code }, `Feature '${code}' not enabled`);
    }
    next();
  };
}

// Helper to constrain date filters for history endpoints
export function enforceRetention(paramFrom: string, paramTo: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const eff = (req as any).features;
    if (!eff) return next();
    const days = eff.retentionDays;
    const now = new Date();
    const minDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const q: any = (req as any).query || {};
    if (q[paramFrom]) {
      const reqFrom = new Date(q[paramFrom]);
      if (reqFrom < minDate) q[paramFrom] = minDate.toISOString();
    } else {
      q[paramFrom] = minDate.toISOString();
    }
    if (!q[paramTo]) q[paramTo] = now.toISOString();
    (req as any).query = q;
    next();
  };
}

// Specific middlewares for reports
export const requireReportGenerate = requireFeature('reports.generate');
export const requireReportDownload = requireFeature('reports.download');