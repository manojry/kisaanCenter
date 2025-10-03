// API Registry - Simple Implementation
import type { Application, Request, Response } from 'express';
export interface ApiModule {
  name: string;
  prefix: string;
  description: string;
  endpoints: Array<unknown>;
}

export class ApiRegistry {
  private modules = new Map<string, ApiModule>();

  constructor() {
    console.log('API Registry initialized');
    // Add some default modules to satisfy the interface
    this.modules.set('default', {
      name: 'default',
      prefix: '/default',
      description: 'Default module',
      endpoints: []
    });
  }

  getModules(): ApiModule[] {
    return Array.from(this.modules.values());
  }

  registerRoutes(app: Application): void {
    console.log('🔧 Registering API routes manually...');
    // Import routes dynamically to avoid circular dependencies
    try {
      const routes = require('../routes');
      // Authentication routes
      app.use('/api/auth', routes.authRoutes);
      // User management routes
      app.use('/api/users', routes.userRoutes);
      app.use('/api/superadmin', routes.superadminRoutes);
      // Shop and category management
      app.use('/api/shops', routes.shopRoutes);
      app.use('/api/categories', routes.categoryRoutes);
      app.use('/api/shop-categories', routes.shopCategoryRoutes);
      app.use('/api/plans', routes.planRoutes);
      // Product management
      app.use('/api/products', routes.productRoutes);
      app.use('/api/test-products', routes.testProductRoutes);
      // Farmer & shop product assignment
      if (routes.farmerProductRoutes) {
        app.use('/api/farmer-products', routes.farmerProductRoutes);
      }
      if (routes.shopProductRoutes) {
        app.use('/api/shop-products', routes.shopProductRoutes);
      }
      // Transaction and payment processing
      app.use('/api/transactions', routes.transactionRoutes);
      app.use('/api/payments', routes.paymentRoutes);
      app.use('/api/credit-advances', routes.creditAdvanceRoutes);
      // Financial management
      app.use('/api/balances', routes.balanceRoutes);
      app.use('/api/balance-snapshots', routes.balanceSnapshotRoutes);
      app.use('/api/commissions', routes.commissionRoutes);
      app.use('/api/settlements', routes.settlementRoutes);
      // Reporting and auditing
      app.use('/api/reports', routes.reportRoutes);
      app.use('/api/audit-logs', routes.auditLogRoutes);
      app.use('/api/features-admin', routes.featureAdminRoutes);
      // Dashboard routes
      app.use('/api/owner-dashboard', routes.ownerDashboardRoute);
      // Simplified transaction system - clear user experience
      if (routes.simplifiedRoutes) {
        app.use('/api/simple', routes.simplifiedRoutes);
        console.log('✅ Simplified transaction routes registered at /api/simple');
      }
      // Diagnostics routes (commission integrity)
      try {
        const express = require('express');
        const { authenticateToken } = require('../middlewares/auth');
        const { loadFeatures, requireFeature } = require('../middlewares/features');
        // Use standardized success responder from shared/http/respond
        const { success } = require('../shared/http/respond');
        const { Transaction } = require('../models/transaction');
        const { logger } = require('../shared/logging/logger');
        const diagnostics = express.Router();
        diagnostics.get('/commission-integrity', authenticateToken, loadFeatures, requireFeature('diagnostics.integrity'), async (req: Request, res: Response) => {
          try {
            const started = Date.now();
            const txns = await Transaction.findAll();
            let raw = 0; let recomputed = 0; let mismatches = 0; const samples: Array<Record<string, unknown>> = [];
            for (const t of txns) {
              const qty = Number((t as Record<string, unknown>).quantity || 0);
              const up = Number((t as Record<string, unknown>).unit_price || 0);
              const rate = Number((t as Record<string, unknown>).commission_rate || 0);
              const stored = Number((t as Record<string, unknown>).commission_amount || 0);
              raw += stored;
              const rc = Number(((qty * up * rate) / 100).toFixed(2));
              recomputed += rc;
              if (Math.abs(stored - rc) > 0.01) {
                mismatches++; if (samples.length < 10) samples.push({ id: (t as Record<string, unknown>).id, stored, rc, rate, qty, up });
              }
            }
            const payload = {
              txn_count: txns.length,
              raw_commission: Number(raw.toFixed(2)),
              recomputed_commission: Number(recomputed.toFixed(2)),
              delta: Number((raw - recomputed).toFixed(2)),
              mismatches,
              mismatch_samples: samples,
              duration_ms: Date.now() - started
            };
            try { logger.info({ ...payload }, '[Diagnostics] commission-integrity'); } catch(_){}
            success(res, payload);
          } catch (e: unknown) {
            const errMsg = (typeof e === 'object' && e && 'message' in e) ? (e as { message?: string }).message : undefined;
            res.status(500).json({ success: false, error: errMsg || 'diagnostics_failed' });
          }
        });
        app.use('/api/diagnostics', diagnostics);
      } catch (diagErr: unknown) {
        const errMsg = (typeof diagErr === 'object' && diagErr && 'message' in diagErr) ? (diagErr as { message?: string }).message : undefined;
        console.warn('Diagnostics route registration failed (non-fatal):', errMsg || diagErr);
      }
      console.log('✅ All API routes registered successfully');
      console.log('📋 Available endpoints:');
      console.log('   • /api/auth/* - Authentication');
      console.log('   • /api/users/* - User management');
      console.log('   • /api/shops/* - Shop management');
      console.log('   • /api/categories/* - Category management');
      console.log('   • /api/products/* - Product management');
      console.log('   • /api/transactions/* - Transaction processing');
      console.log('   • /api/payments/* - Payment processing');
      console.log('   • /api/balances/* - Balance management');
      console.log('   • /api/reports/* - Reporting');
      console.log('   • And more...');
    } catch (error) {
      console.error('❌ Error loading routes:', error);
      console.log('⚠️  Continuing with stub routes...');
    }
  }

  getAllEndpoints() {
    return [];
  }

  getOpenApiSpec() {
    return {
      openapi: '3.0.0',
      info: {
        title: 'Kisaan Center API',
        version: '1.0.0'
      },
      paths: {}
    };
  }


  generateSummary() {
    return 'API Registry: Manual route registration mode';
  }
}

export const apiRegistry = new ApiRegistry();
export default apiRegistry;
