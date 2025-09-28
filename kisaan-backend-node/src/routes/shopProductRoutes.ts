import express, { Request, Response } from 'express';
import { ShopProductService } from '../services/shopProductService';
import { ControllerUtils, ResponseUtils } from '../utils/routeUtils';

const router = express.Router();
const service = new ShopProductService();

// GET /shops/:shopId/products
router.get('/shops/:shopId/products', ControllerUtils.asyncHandler(async (req: Request, res: Response) => {
  const shopId = Number(req.params.shopId);
  const data = await service.list(shopId);
  ResponseUtils.success(res, data);
}));

// POST /shops/:shopId/products { product_id }
router.post('/shops/:shopId/products', ControllerUtils.asyncHandler(async (req: Request, res: Response) => {
  const shopId = Number(req.params.shopId);
  const { product_id } = req.body || {};
  const sp = await service.assign(shopId, Number(product_id));
  res.status(201).json({ success: true, data: sp });
}));

// PATCH /shops/:shopId/products/:shopProductId/deactivate
router.patch('/shops/:shopId/products/:shopProductId/deactivate', ControllerUtils.asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.shopProductId);
  const updated = await service.deactivate(id);
  ResponseUtils.success(res, updated);
}));

export default router;
