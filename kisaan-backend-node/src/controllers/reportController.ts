import { Request, Response } from 'express';

export const generateReport = async (req: Request, res: Response) => {
  try {
    const { shop_id, user_id, date_from, date_to, report_type, format = 'json' } = req.query;
    const userRole = (req as any).user?.role;

    // Superadmin can generate platform-wide reports without shop_id
    if (userRole === 'superadmin') {
      if (!report_type || !['platform', 'shops', 'users', 'transactions'].includes(report_type as string)) {
        return res.status(400).json({ error: 'report_type must be platform, shops, users, or transactions for superadmin' });
      }
      if (report_type === 'platform') {
        // Parse date range
        const from = date_from ? new Date(date_from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const to = date_to ? new Date(date_to as string) : new Date();

        // Import models here to avoid circular deps
        const { Shop } = require('../models/shop');
        const { User } = require('../models/user');
        const { Transaction } = require('../models/transaction');
        // 1. Total shops
        const totalShops = await Shop.count();
        // 2. Active shops
        const activeShops = await Shop.count({ where: { status: 'active' } });
        // 3. Total users
        const totalUsers = await User.count();
        // 4. Active users
        const activeUsers = await User.count({ where: { status: 'active' } });
        // 5. Total transactions (in date range)
        const totalTransactions = await Transaction.count({ where: { created_at: { $gte: from, $lte: to } } });
        // 6. Total revenue (sum of total_sale_value in date range)
        const { sum: totalRevenue } = await Transaction.findOne({
          attributes: [[require('sequelize').fn('SUM', require('sequelize').col('total_sale_value')), 'sum']],
          where: { created_at: { $gte: from, $lte: to } },
          raw: true
        }) || { sum: 0 };
        // 7. Recent transactions (last 10)
        const recentTransactions = await Transaction.findAll({
          order: [['created_at', 'DESC']],
          limit: 10,
          raw: true
        });
        // 8. Top shops (by transaction count in date range)
        const topShopsRaw = await Transaction.findAll({
          attributes: ['shop_id', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'txnCount']],
          where: { created_at: { $gte: from, $lte: to } },
          group: ['shop_id'],
          order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
          limit: 5,
          raw: true
        });
        // Get shop details for topShops
        const shopIds = topShopsRaw.map((s: any) => s.shop_id);
        const shops = await Shop.findAll({ where: { id: shopIds }, raw: true });
        const topShops = topShopsRaw.map((s: any) => {
          const shop = shops.find((sh: any) => sh.id === s.shop_id) || {};
          return {
            id: shop.id,
            name: shop.name,
            owner_id: shop.owner_id,
            status: shop.status,
            created_at: shop.createdAt,
            txnCount: s.txnCount
          };
        });
        return res.json({
          success: true,
          data: {
            totalShops,
            totalUsers,
            totalTransactions,
            totalRevenue: Number(totalRevenue) || 0,
            activeShops,
            activeUsers,
            recentTransactions,
            topShops
          }
        });
      }
      // fallback for other report_types
      return res.json({
        success: true,
        data: { report_type, date_from, date_to, scope: 'platform', message: 'Not implemented' }
      });
    }

    // For non-superadmin users, shop_id is required for shop-level reports
    if (report_type === 'shop') {
      if (!shop_id) {
        return res.status(400).json({ error: 'shop_id is required for shop-level reports' });
      }
      // Parse date range
      const from = date_from ? new Date(date_from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = date_to ? new Date(date_to as string) : new Date();

      const { Shop } = require('../models/shop');
      const { User } = require('../models/user');
      const { Transaction } = require('../models/transaction');
      // 1. Shop info
      const shop = await Shop.findByPk(shop_id);
      if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
      }
      // 2. Total users in shop
      const totalUsers = await User.count({ where: { shop_id: shop_id } });
      // 3. Active users in shop
      const activeUsers = await User.count({ where: { shop_id: shop_id, status: 'active' } });
      // 4. Total transactions for shop (in date range)
      const totalTransactions = await Transaction.count({ where: { shop_id: shop_id, created_at: { $gte: from, $lte: to } } });
      // 5. Total revenue for shop (sum of total_sale_value in date range)
      const { sum: totalRevenue } = await Transaction.findOne({
        attributes: [[require('sequelize').fn('SUM', require('sequelize').col('total_sale_value')), 'sum']],
        where: { shop_id: shop_id, created_at: { $gte: from, $lte: to } },
        raw: true
      }) || { sum: 0 };
      // 6. Recent transactions for shop (last 10)
      const recentTransactions = await Transaction.findAll({
        where: { shop_id: shop_id },
        order: [['created_at', 'DESC']],
        limit: 10,
        raw: true
      });
      // 7. Top users (by transaction count in shop)
      const topUsersRaw = await Transaction.findAll({
        attributes: ['buyer_id', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'txnCount']],
        where: { shop_id: shop_id, created_at: { $gte: from, $lte: to } },
        group: ['buyer_id'],
        order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
        limit: 5,
        raw: true
      });
      const userIds = topUsersRaw.map((u: any) => u.buyer_id);
      const users = await User.findAll({ where: { id: userIds }, raw: true });
      const topUsers = topUsersRaw.map((u: any) => {
        const user = users.find((us: any) => us.id === u.buyer_id) || {};
        return {
          id: user.id,
          username: user.username,
          role: user.role,
          status: user.status,
          created_at: user.created_at,
          txnCount: u.txnCount
        };
      });
      return res.json({
        success: true,
        data: {
          shop: {
            id: shop.id,
            name: shop.name,
            owner_id: shop.owner_id,
            status: shop.status,
            created_at: shop.createdAt
          },
          totalUsers,
          activeUsers,
          totalTransactions,
          totalRevenue: Number(totalRevenue) || 0,
          recentTransactions,
          topUsers
        }
      });
    }
    // fallback for other report_types
    if (!shop_id) {
      return res.status(400).json({ error: 'shop_id is required for shop-level reports' });
    }
    if (!report_type || !['farmer', 'user'].includes(report_type as string)) {
      return res.status(400).json({ error: 'report_type must be farmer or user' });
    }
    if ((report_type === 'farmer' || report_type === 'user') && !user_id) {
      return res.status(400).json({ error: 'user_id is required for farmer and user reports' });
    }
    // fallback shop-level report
    const reportData = {
      shop_id,
      user_id,
      date_from,
      date_to,
      report_type,
      scope: 'shop',
      message: 'Shop-level report generation not fully implemented yet'
    };
    res.json({
      success: true,
      data: reportData
    });

  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      error: 'Failed to generate report',
      message: error.message 
    });
  }
};

export const downloadReport = async (req: Request, res: Response) => {
  try {
    const { shop_id, user_id, date_from, date_to, report_type } = req.query;
    const userRole = (req as any).user?.role;

    // Superadmin can download platform-wide reports
    if (userRole === 'superadmin') {
      if (!report_type || !['platform', 'shops', 'users', 'transactions'].includes(report_type as string)) {
        return res.status(400).json({ error: 'report_type must be platform, shops, users, or transactions for superadmin' });
      }
      
      const reportData = {
        report_type,
        date_from,
        date_to,
        scope: 'platform',
        message: 'Platform-wide report download not fully implemented yet'
      };
      
      return res.json({
        success: true,
        data: reportData
      });
    }

    // For non-superadmin users, shop_id is required
    if (!shop_id) {
      return res.status(400).json({ error: 'shop_id is required for shop-level reports' });
    }

    if (!report_type || !['farmer', 'user', 'shop'].includes(report_type as string)) {
      return res.status(400).json({ error: 'report_type must be farmer, user, or shop' });
    }

    if ((report_type === 'farmer' || report_type === 'user') && !user_id) {
      return res.status(400).json({ error: 'user_id is required for farmer and user reports' });
    }

    // Shop-level download
    const reportData = {
      shop_id,
      user_id,
      date_from,
      date_to,
      report_type,
      scope: 'shop',
      message: 'Shop-level report download not fully implemented yet'
    };
    
    res.json({
      success: true,
      data: reportData
    });

  } catch (error: any) {
    console.error('Error downloading report:', error);
    res.status(500).json({ 
      error: 'Failed to download report',
      message: error.message 
    });
  }
};