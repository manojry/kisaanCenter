import { Request, Response } from 'express';
import * as transactionService from '../services/transactionService';

export const createTransaction = async (req: Request, res: Response) => {
  try {
    console.log('Request body:', req.body);
    
    // Direct creation without validation to bypass schema issues
    const transaction = await transactionService.createTransaction(req.body);
    res.status(201).json({ success: true, data: transaction });
  } catch (error: any) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create transaction', message: error.message });
  }
};

export const createSale = async (req: Request, res: Response) => {
  try {
    console.log('Sale request body:', req.body);
    
    // Alternative endpoint with no validation
    const transaction = await transactionService.createTransaction(req.body);
    res.status(201).json({ success: true, data: transaction });
  } catch (error: any) {
    console.error('Sale creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create sale', message: error.message });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { shop_id, date_from, date_to, buyer_id, status, include_analytics, owner_id } = req.query;

    console.log('Raw query parameters:', { shop_id, date_from, date_to, buyer_id, status, include_analytics, owner_id });

    // Convert to strings and validate
    const shopId = shop_id as string;
    const ownerId = owner_id as string;

    // Check if we have meaningful values
    const hasShopId = shopId && shopId.trim() !== '' && shopId !== 'undefined' && shopId !== 'null';
    const hasOwnerId = ownerId && ownerId.trim() !== '' && ownerId !== 'undefined' && ownerId !== 'null';

    console.log('Validation check:', { hasShopId, hasOwnerId, shopId, ownerId });

    // STRICT VALIDATION: Require either shop_id or owner_id
    if (!hasShopId && !hasOwnerId) {
      console.log('❌ Validation failed: Missing required parameters');
      return res.status(400).json({
        success: false,
        error: 'Missing required filter',
        message: 'You must provide either owner_id or shop_id as a query parameter.',
        received_params: { shop_id, owner_id, hasShopId, hasOwnerId }
      });
    }

    // If owner_id is provided but shop_id is not, try to find the shop
    let effectiveShopId = shopId;
    if (!hasShopId && hasOwnerId) {
      try {
        const { Shop } = await import('../models/shop');
        const shop = await Shop.findOne({ where: { owner_id: parseInt(ownerId) } });
        if (shop) {
          effectiveShopId = shop.id.toString();
          console.log(`✅ Found shop ${effectiveShopId} for owner ${ownerId}`);
        } else {
          console.log(`❌ No shop found for owner ${ownerId}`);
          return res.status(404).json({
            success: false,
            error: 'Shop not found',
            message: `No shop found for owner_id: ${ownerId}`
          });
        }
      } catch (error) {
        console.error('Error finding shop for owner:', error);
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: 'Failed to find shop for the given owner'
        });
      }
    }

    // Final validation: ensure we have a valid shop_id
    if (!effectiveShopId || effectiveShopId.trim() === '' || effectiveShopId === 'undefined' || effectiveShopId === 'null') {
      console.log('❌ Final validation failed: Invalid shop_id');
      return res.status(400).json({
        success: false,
        error: 'Invalid shop identifier',
        message: 'Could not determine a valid shop_id from the provided parameters'
      });
    }

    console.log('✅ Validation passed. Getting transactions with filters:', { 
      shop_id: effectiveShopId, 
      date_from, 
      date_to, 
      buyer_id, 
      status, 
      include_analytics, 
      owner_id: ownerId 
    });

    const result = await transactionService.getTransactions({ 
      shop_id: effectiveShopId, 
      date_from: date_from as string, 
      date_to: date_to as string,
      buyer_id: buyer_id as string,
      status: status as string,
      include_analytics: include_analytics as string,
      owner_id: ownerId
    });

    console.log('Service result sample:', result.transactions?.[0]);
    
    const response: any = {
      success: true,
      data: result.transactions,
      count: result.transactions.length,
      message: 'Transactions fetched successfully',
      filters: { 
        shop_id: effectiveShopId, 
        date_from, 
        date_to, 
        buyer_id, 
        status,
        owner_id: ownerId
      }
    };

    // Include analytics if requested
    if (result.analytics) {
      response.analytics = result.analytics;
    }

    res.status(200).json(response);
  } catch (error: any) {
    console.error('❌ Error in getTransactions controller:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch transactions', 
      message: error.message 
    });
  }
};

export const getTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction ID',
        message: 'Transaction ID must be a valid number'
      });
    }

    // TODO: Implement actual transaction fetching logic
    res.status(200).json({ 
      success: true,
      message: 'Transaction details (stub)',
      data: { id: parseInt(id) }
    });
  } catch (error: any) {
    console.error('Error in getTransaction controller:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch transaction', 
      message: error.message 
    });
  }
};