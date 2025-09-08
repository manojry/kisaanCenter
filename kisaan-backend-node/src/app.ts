import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models to ensure they're initialized
import './models';

// Import routes

import { shopRoutes } from './routes/shopRoutes';
import { planRoutes } from './routes/planRoutes';
import { categoryRoutes } from './routes/categoryRoutes';
import { shopCategoryRoutes } from './routes/shopCategoryRoutes';
import { transactionRoutes } from './routes/transactionRoutes';
import { paymentRoutes } from './routes/paymentRoutes';
import { creditAdvanceRoutes } from './routes/creditAdvanceRoutes';
import { balanceRoutes } from './routes/balanceRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { productRoutes } from './routes/productRoutes';
import reportRoutes from './routes/reportRoutes';
import settlementRoutes from './routes/settlementRoutes';

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000',
    'http://localhost:8080',
    ...(process.env.CORS_ORIGINS?.split(',') || [])
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.path.startsWith('/api/products')) {
    console.log('🔍 PRODUCTS REQUEST DETECTED:', req.method, req.path);
  }
  if (req.path.startsWith('/api/transactions')) {
    console.log('🔍 TRANSACTIONS REQUEST DETECTED:', req.method, req.path);
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'KisaanCenter Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health',
      'GET /api/test',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/users',
      'POST /api/users',
      'GET /api/products',
      'POST /api/products',
      'GET /api/products/:id',
      'PUT /api/products/:id',
      'DELETE /api/products/:id',
      'GET /api/products/test',
      'GET /api/shops',
      'POST /api/shops',
      'GET /api/shops/:id',
      'GET /api/shops/:id/products',
      'POST /api/shops/:shopId/products/:productId',
      'DELETE /api/shops/:shopId/products/:productId',
      'PATCH /api/shops/:shopId/products/:productId',
      'PUT /api/shops/:id',
      'DELETE /api/shops/:id',
      'GET /api/plans',
      'POST /api/plans',
      'GET /api/plans/:id',
      'PUT /api/plans/:id',
      'DELETE /api/plans/:id',
      'GET /api/categories',
      'POST /api/categories',
      'GET /api/categories/:id',
      'PUT /api/categories/:id',
      'DELETE /api/categories/:id',
      'POST /api/shop-categories/assign',
      'POST /api/shop-categories/remove',
      'GET /api/shop-categories/shop/:shopId/categories'
    ]
  });
});

// API Routes
console.log('🔧 Registering product routes...');
app.use('/api/products', productRoutes);
console.log('🔧 Product routes registered successfully');
console.log('🔧 Registered routes so far:', app._router?.stack?.length || 'unknown');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);

app.use('/api/plans', planRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/shop-categories', shopCategoryRoutes);

console.log('🔧 Registering transaction routes...');
try {
  app.use('/api/transactions', transactionRoutes);
  console.log('🔧 Transaction routes registered successfully');
} catch (error) {
  console.error('❌ Error registering transaction routes:', error);
}

app.use('/api/payments', paymentRoutes);
app.use('/api/credits', creditAdvanceRoutes);
// app.use('/api/balance', balanceRoutes); // Temporarily disabled
app.use('/api/reports', reportRoutes);
app.use('/api/settlements', settlementRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /health',
      'GET /api/test',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/users',
      'POST /api/users',
      'GET /api/products',
      'POST /api/products',
      'GET /api/products/:id',
      'PUT /api/products/:id',
      'DELETE /api/products/:id',
      'GET /api/products/test',
      'GET /api/shops',
      'POST /api/shops',
      'GET /api/shops/:id',
      'GET /api/shops/:id/products',
      'POST /api/shops/:shopId/products/:productId',
      'DELETE /api/shops/:shopId/products/:productId',
      'PATCH /api/shops/:shopId/products/:productId',
      'PUT /api/shops/:id',
      'DELETE /api/shops/:id',
      'GET /api/plans',
      'POST /api/plans',
      'GET /api/plans/:id',
      'PUT /api/plans/:id',
      'DELETE /api/plans/:id',
      'GET /api/categories',
      'POST /api/categories',
      'GET /api/categories/:id',
      'PUT /api/categories/:id',
      'DELETE /api/categories/:id',
      'POST /api/shop-categories/assign',
      'POST /api/shop-categories/remove',
      'GET /api/shop-categories/shop/:shopId/categories'
    ]
  });
});

export default app;