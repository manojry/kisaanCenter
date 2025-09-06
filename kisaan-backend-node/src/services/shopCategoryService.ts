import { ShopCategory } from '../models/shopCategory';
import { Shop } from '../models/shop';
import { Category } from '../models/category';
import { 
  ShopCategoryCreate, 
  AssignCategoriesToShop, 
  RemoveCategoriesFromShop 
} from '../schemas/shopCategory';
import { Transaction } from 'sequelize';
import sequelize from '../config/database';

export const assignCategoryToShop = async (data: ShopCategoryCreate): Promise<ShopCategory> => {
  const shopCategory = await ShopCategory.create({
    shop_id: data.shop_id,
    category_id: data.category_id,
  });
  return shopCategory;
};

export const assignCategoriesToShop = async (data: AssignCategoriesToShop): Promise<ShopCategory[]> => {
  const transaction: Transaction = await sequelize.transaction();
  
  try {
    const shopCategories: ShopCategory[] = [];
    
    for (const category_id of data.category_ids) {
      // Check if assignment already exists
      const existing = await ShopCategory.findOne({
        where: {
          shop_id: data.shop_id,
          category_id: category_id,
        },
        transaction,
      });
      
      if (!existing) {
        const shopCategory = await ShopCategory.create({
          shop_id: data.shop_id,
          category_id: category_id,
        }, { transaction });
        
        shopCategories.push(shopCategory);
      }
    }
    
    await transaction.commit();
    return shopCategories;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const removeCategoriesFromShop = async (data: RemoveCategoriesFromShop): Promise<number> => {
  const deletedCount = await ShopCategory.destroy({
    where: {
      shop_id: data.shop_id,
      category_id: data.category_ids,
    },
  });
  return deletedCount;
};

export const getShopCategories = async (shopId: number): Promise<Category[]> => {
  const shop = await Shop.findByPk(shopId, {
    include: [
      {
        model: Category,
        as: 'categories',
        through: { attributes: [] }, // Exclude join table attributes
        where: { is_active: true },
        required: false,
      },
    ],
  });
  
  return (shop as any)?.categories || [];
};

export const getCategoryShops = async (categoryId: number): Promise<Shop[]> => {
  const category = await Category.findByPk(categoryId, {
    include: [
      {
        model: Shop,
        as: 'shops',
        through: { attributes: [] }, // Exclude join table attributes
        where: { status: 'active' },
        required: false,
      },
    ],
  });
  
  return (category as any)?.shops || [];
};

export const isShopCategoryAssigned = async (shopId: number, categoryId: number): Promise<boolean> => {
  const assignment = await ShopCategory.findOne({
    where: {
      shop_id: shopId,
      category_id: categoryId,
    },
  });
  
  return !!assignment;
};

export const getShopCategoryAssignments = async (shopId?: number, categoryId?: number): Promise<ShopCategory[]> => {
  const where: any = {};
  if (shopId) where.shop_id = shopId;
  if (categoryId) where.category_id = categoryId;
  
  const assignments = await ShopCategory.findAll({
    where,
    include: [
      {
        model: Shop,
        as: 'shop',
        attributes: ['id', 'name', 'status'],
      },
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'is_active'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
  
  return assignments;
};

export const removeAllCategoriesFromShop = async (shopId: number): Promise<number> => {
  const deletedCount = await ShopCategory.destroy({
    where: { shop_id: shopId },
  });
  return deletedCount;
};

export const removeShopFromAllCategories = async (shopId: number): Promise<number> => {
  return removeAllCategoriesFromShop(shopId);
};
