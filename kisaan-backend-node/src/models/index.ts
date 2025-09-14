import sequelize from '../config/database';
import { User } from './user';
import { Shop } from './shop';
import { Plan } from './plan';
import { Category } from './category';
import { Product } from './product';
import { ShopCategory } from './shopCategory';
import { Transaction } from './transaction';
import { Payment } from './payment';
import { CreditAdvance } from './creditAdvance';
import { ShopProducts } from './shopProducts';
import { Settlement } from './settlement';
import { Commission } from './commission';
import { AuditLog } from './auditLog';
import { PlanUsage } from './planValidation';
import BalanceSnapshot from './balanceSnapshot';
import { PaymentAllocation } from './paymentAllocation';

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
  Settlement,
  Commission,
  AuditLog,
  PlanUsage,
  BalanceSnapshot,
  PaymentAllocation,
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
ShopCategory.belongsTo(Shop, { foreignKey: 'shop_id', as: 'categoryShop' });
ShopCategory.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Shop.hasMany(ShopCategory, { foreignKey: 'shop_id', as: 'shopCategories' });
Category.hasMany(ShopCategory, { foreignKey: 'category_id', as: 'shopCategories' });

// Shop-Product many-to-many associations
Shop.belongsToMany(Product, {
  through: ShopProducts,
  foreignKey: 'shop_id',
  otherKey: 'product_id',
  as: 'products'
});
Product.belongsToMany(Shop, {
  through: ShopProducts,
  foreignKey: 'product_id',
  otherKey: 'shop_id',
  as: 'shops'
});

// Direct associations for ShopProducts
ShopProducts.belongsTo(Shop, { foreignKey: 'shop_id', as: 'productShop' });
ShopProducts.belongsTo(Product, { foreignKey: 'product_id', as: 'shopProduct' });
Shop.hasMany(ShopProducts, { foreignKey: 'shop_id', as: 'shopProducts' });
Product.hasMany(ShopProducts, { foreignKey: 'product_id', as: 'shopProducts' });

// User associations
User.belongsTo(Shop, { foreignKey: 'shop_id', as: 'userShop' });
Shop.hasMany(User, { foreignKey: 'shop_id', as: 'users' });

// Transaction associations
Transaction.belongsTo(Shop, { foreignKey: 'shop_id', as: 'transactionShop' });
Transaction.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Transaction.belongsTo(User, { foreignKey: 'buyer_id', as: 'buyer' });
Transaction.belongsTo(User, { foreignKey: 'farmer_id', as: 'farmer' });

// Reverse associations for Transaction
Shop.hasMany(Transaction, { foreignKey: 'shop_id', as: 'transactions' });
Category.hasMany(Transaction, { foreignKey: 'category_id', as: 'transactions' });
User.hasMany(Transaction, { foreignKey: 'buyer_id', as: 'buyerTransactions' });
User.hasMany(Transaction, { foreignKey: 'farmer_id', as: 'farmerTransactions' });

// Payment associations
Payment.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
Transaction.hasMany(Payment, { foreignKey: 'transaction_id', as: 'payments' });

// Credit Advance associations
CreditAdvance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
CreditAdvance.belongsTo(Shop, { foreignKey: 'shop_id', as: 'creditShop' });
User.hasMany(CreditAdvance, { foreignKey: 'user_id', as: 'creditAdvances' });
Shop.hasMany(CreditAdvance, { foreignKey: 'shop_id', as: 'creditAdvances' });

// Settlement associations
Settlement.belongsTo(Shop, { foreignKey: 'shop_id', as: 'settlementShop' });
Settlement.belongsTo(User, { foreignKey: 'user_id', as: 'settlementUser' });
Settlement.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
Shop.hasMany(Settlement, { foreignKey: 'shop_id', as: 'settlements' });
User.hasMany(Settlement, { foreignKey: 'user_id', as: 'settlements' });
Transaction.hasMany(Settlement, { foreignKey: 'transaction_id', as: 'settlements' });

// Commission associations
Commission.belongsTo(Shop, { foreignKey: 'shop_id', as: 'commissionShop' });
Shop.hasMany(Commission, { foreignKey: 'shop_id', as: 'commissions' });

// AuditLog associations
AuditLog.belongsTo(Shop, { foreignKey: 'shop_id', as: 'auditShop' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'auditUser' });
Shop.hasMany(AuditLog, { foreignKey: 'shop_id', as: 'auditLogs' });
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });

// PlanUsage associations
PlanUsage.belongsTo(Shop, { foreignKey: 'shop_id', as: 'usageShop' });
PlanUsage.belongsTo(Plan, { foreignKey: 'plan_id', as: 'usagePlan' });
Shop.hasMany(PlanUsage, { foreignKey: 'shop_id', as: 'planUsage' });
Plan.hasMany(PlanUsage, { foreignKey: 'plan_id', as: 'planUsage' });

// Export sequelize instance and all models
export { 
  sequelize, 
  User, 
  Shop, 
  Plan, 
  Category, 
  Product, 
  ShopCategory, 
  Transaction, 
  Payment, 
  CreditAdvance, 
  ShopProducts, 
  Settlement, 
  Commission,
  AuditLog,
  PlanUsage,
  BalanceSnapshot,
  PaymentAllocation
};

export default models;