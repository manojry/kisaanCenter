import { Request, Response } from 'express';
import { User, Shop } from '../models';
import { createSettlement } from '../services/settlementService';
import { AuthenticatedRequest } from '../middlewares/auth';

// Helper function to get user's shop_id
const getUserShopId = async (userId: number): Promise<number | null> => {
  const user = await User.findByPk(userId);
  if (!user) return null;
  
  // If user has direct shop_id, return it
  if (user.shop_id) return user.shop_id;
  
  // If user is owner, find their shop by user id
  if (user.role === 'owner') {
    const shop = await Shop.findOne({ where: { owner_id: user.id } });
    return shop?.id || null;
  }
  
  return null;
};

// Add payment made to farmer (increases farmer balance)
export const addPaymentToFarmer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { farmer_id, amount, description } = req.body;
    
    // Get user's shop_id
    let userShopId = req.user?.shop_id;
    if (!userShopId && req.user?.id) {
      userShopId = await getUserShopId(req.user.id);
    }
    
    if (!userShopId) {
      return res.status(400).json({ success: false, message: 'User shop not found' });
    }
    
    const farmer = await User.findByPk(farmer_id);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

  // Update farmer balance (payment reduces what shop owes the farmer)
  let newBalance = (farmer.balance || 0) - parseFloat(amount);
  if (newBalance < 0) newBalance = 0;
  await farmer.update({ balance: newBalance });

    // Create settlement record
    await createSettlement({
      shop_id: userShopId,
      user_id: farmer_id,
      user_type: 'farmer',
      amount: parseFloat(amount),
      type: 'payment_made',
      description: description || `Payment made to farmer ${farmer.username}`
    });

    res.json({ 
      success: true, 
      message: 'Payment added successfully',
      new_balance: newBalance 
    });
  } catch (error) {
    console.error('Error adding payment to farmer:', error);
    res.status(500).json({ success: false, message: 'Failed to add payment' });
  }
};

// Add payment received from buyer (increases buyer balance - credit)
export const addPaymentFromBuyer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { buyer_id, amount, description } = req.body;
    
    // Get user's shop_id
    let userShopId = req.user?.shop_id;
    if (!userShopId && req.user?.id) {
      userShopId = await getUserShopId(req.user.id);
    }
    
    if (!userShopId) {
      return res.status(400).json({ success: false, message: 'User shop not found' });
    }
    
    const buyer = await User.findByPk(buyer_id);
    if (!buyer) {
      return res.status(404).json({ success: false, message: 'Buyer not found' });
    }

  // Update buyer balance (payment reduces what buyer owes)
  let newBalance = (buyer.balance || 0) - parseFloat(amount);
  if (newBalance < 0) newBalance = 0;
  await buyer.update({ balance: newBalance });

    // Create settlement record
    await createSettlement({
      shop_id: userShopId,
      user_id: buyer_id,
      user_type: 'buyer',
      amount: parseFloat(amount),
      type: 'payment_received',
      description: description || `Payment received from buyer ${buyer.username}`
    });

    res.json({ 
      success: true, 
      message: 'Payment received successfully',
      new_balance: newBalance 
    });
  } catch (error) {
    console.error('Error adding payment from buyer:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
};

// Get user balance
export const getUserBalance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'role', 'balance']
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ 
      success: true, 
      data: {
        user_id: user.id,
        username: user.username,
        role: user.role,
        balance: user.balance || 0
      }
    });
  } catch (error) {
    console.error('Error getting user balance:', error);
    res.status(500).json({ success: false, message: 'Failed to get balance' });
  }
};

// Get shop balance
export const getShopBalance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    
    const shop = await Shop.findByPk(shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // Get all users in this shop and sum their balances
    const users = await User.findAll({
      where: { shop_id: shopId },
      attributes: ['id', 'username', 'role', 'balance']
    });

    const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);

    res.json({ 
      success: true, 
      data: {
        shop_id: shopId,
        total_balance: totalBalance,
        user_count: users.length,
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          role: u.role,
          balance: u.balance || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error getting shop balance:', error);
    res.status(500).json({ success: false, message: 'Failed to get shop balance' });
  }
};

// Update balance
export const updateBalance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user_id, amount, type, description } = req.body;
    
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentBalance = user.balance || 0;
    const changeAmount = parseFloat(amount);
    const newBalance = type === 'credit' 
      ? currentBalance + changeAmount 
      : currentBalance - changeAmount;

    await user.update({ balance: newBalance });

    res.json({ 
      success: true, 
      data: {
        user_id,
        previous_balance: currentBalance,
        change_amount: changeAmount,
        new_balance: newBalance,
        type,
        description
      }
    });
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({ success: false, message: 'Failed to update balance' });
  }
};

// Get balance history
export const getBalanceHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    // For now, return empty history as we don't have a balance history table
    // In a real implementation, you'd have a balance_transactions table
    res.json({ 
      success: true, 
      data: [],
      message: 'Balance history feature not implemented yet'
    });
  } catch (error) {
    console.error('Error getting balance history:', error);
    res.status(500).json({ success: false, message: 'Failed to get balance history' });
  }
};