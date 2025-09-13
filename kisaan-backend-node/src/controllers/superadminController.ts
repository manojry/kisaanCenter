import { Request, Response } from 'express';
import { Shop, User, Transaction } from '../models';
import { Op } from 'sequelize';

export const getSuperadminDashboard = async (req: Request, res: Response) => {
  try {
    // Get aggregated counts only - no individual records
    const [totalShops, totalUsers, totalTransactions] = await Promise.all([
      Shop.count(),
      User.count({ where: { role: { [Op.ne]: 'superadmin' } } }),
      Transaction.count()
    ]);

    const [activeShops, activeUsers] = await Promise.all([
      Shop.count({ where: { status: 'active' } }),
      User.count({ where: { status: 'active', role: { [Op.ne]: 'superadmin' } } })
    ]);

    // Get aggregated revenue (sum only, no individual transactions)
    const revenueResult = await Transaction.findOne({
      attributes: [
        [Transaction.sequelize!.fn('SUM', Transaction.sequelize!.col('total_sale_value')), 'totalRevenue'],
        [Transaction.sequelize!.fn('SUM', Transaction.sequelize!.col('shop_commission')), 'totalCommission']
      ],
      raw: true
    }) as any;

    // Get shop counts by status for charts
    const shopStats = await Shop.findAll({
      attributes: [
        'status',
        [Shop.sequelize!.fn('COUNT', Shop.sequelize!.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Get user counts by role for charts  
    const userStats = await User.findAll({
      attributes: [
        'role',
        [User.sequelize!.fn('COUNT', User.sequelize!.col('id')), 'count']
      ],
      where: { role: { [Op.ne]: 'superadmin' } },
      group: ['role'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        metrics: {
          totalShops,
          totalUsers,
          totalTransactions,
          activeShops,
          activeUsers,
          totalRevenue: parseFloat(revenueResult?.['totalRevenue'] || '0'),
          totalCommission: parseFloat(revenueResult?.['totalCommission'] || '0')
        },
        charts: {
          shopStats,
          userStats
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching superadmin dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
};