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
  
  // If user is owner, find their shop
  if (user.role === 'owner' && user.owner_id) {
    const shop = await Shop.findOne({ where: { owner_id: user.owner_id } });
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

    // Update farmer balance
    const newBalance = (farmer.balance || 0) + parseFloat(amount);
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

    // Update buyer balance (credit)
    const newBalance = (buyer.balance || 0) + parseFloat(amount);
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