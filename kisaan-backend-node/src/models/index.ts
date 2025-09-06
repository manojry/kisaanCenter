
import sequelize from '../config/database';
import User from './user';
import Shop from './shop';
import Plan from './plan';
import Category from './category';
import Product from './product';
import ShopCategory from './shopCategory';
import { Transaction } from './transaction';
import { Payment } from './payment';
import { CreditAdvance } from './creditAdvance';

import ShopProducts from './shopProducts';
// Initialize all models
const models = {
  User,
  Shop,
  Plan,
  Category,
  Product,
  ShopCategory,
  Transaction,
  ShopProducts,
  Payment,
  CreditAdvance,
};

// Set up associations
// Plan associations
Plan.hasMany(Shop, { foreignKey: 'plan_id', as: 'shops' });
Shop.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' });

// Category associations
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Shop-Category many-to-many associations
Shop.belongsToMany(Category, { 
  through: ShopCategory, 
  foreignKey: 'shop_id', 
  otherKey: 'category_id',
  as: 'categories' 
});
Category.belongsToMany(Shop, { 
  through: ShopCategory, 
  foreignKey: 'category_id', 
  otherKey: 'shop_id',
  as: 'shops' 
});

// Direct associations for ShopCategory
ShopCategory.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
ShopCategory.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Shop.hasMany(ShopCategory, { foreignKey: 'shop_id', as: 'shopCategories' });
Category.hasMany(ShopCategory, { foreignKey: 'category_id', as: 'shopCategories' });

export { sequelize, User, Shop, Plan, Category, Product, ShopCategory, Transaction, Payment, CreditAdvance };
export default models;