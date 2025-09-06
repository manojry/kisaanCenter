import { Plan } from '../src/models/plan';
import { Category } from '../src/models/category';
import { Product } from '../src/models/product';
import { ShopCategory } from '../src/models/shopCategory';
import { Shop } from '../src/models/shop';
import sequelize from '../src/config/database';

async function createTables() {
  try {
    console.log('🔄 Creating database tables...');

    // Drop existing tables if they exist (force recreate)
    await sequelize.query('DROP TABLE IF EXISTS "kisaan_shop_categories" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "kisaan_products" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "kisaan_categories" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "plans" CASCADE;');

    // Create tables in the correct order (dependencies first)
    console.log('📝 Creating Plan table...');
    await Plan.sync({ force: true });

    console.log('📝 Creating Category table...');
    await Category.sync({ force: true });

    console.log('📝 Creating Product table...');
    await Product.sync({ force: true });

    console.log('📝 Creating ShopCategory table...');
    await ShopCategory.sync({ force: true });

    // Update Shop table to add plan_id column
    console.log('📝 Updating Shop table with plan_id...');
    await Shop.sync({ alter: true });

    console.log('✅ All tables created successfully!');

    // Seed some test data
    console.log('🌱 Seeding test data...');

    // Create Plans
    const basicPlan = await Plan.create({
      name: 'Basic Plan',
      description: 'Basic subscription for small shops',
      max_users: 5,
      max_products: 100,
      max_transactions: 1000,
      price: 29.99,
      billing_cycle: 'monthly',
      features: JSON.stringify(['Basic inventory', 'Sales tracking', 'Customer management']),
      is_active: true
    });

    const proPlan = await Plan.create({
      name: 'Pro Plan',
      description: 'Professional subscription for growing businesses',
      max_users: 25,
      max_products: 1000,
      max_transactions: 10000,
      price: 99.99,
      billing_cycle: 'monthly',
      features: JSON.stringify(['Advanced inventory', 'Detailed analytics', 'Multi-location support', 'API access']),
      is_active: true
    });

    // Create Categories
    const electronicsCategory = await Category.create({
      name: 'Electronics',
      description: 'Electronic items and gadgets',
      display_order: 1,
      is_active: true
    });

    const clothingCategory = await Category.create({
      name: 'Clothing',
      description: 'Apparel and fashion items',
      display_order: 2,
      is_active: true
    });

    const groceryCategory = await Category.create({
      name: 'Grocery',
      description: 'Food and daily essentials',
      display_order: 3,
      is_active: true
    });

    // Create Products
    await Product.create({
      name: 'Smartphone',
      description: 'Latest smartphone with advanced features',
      unit: 'piece',
      category_id: electronicsCategory.id,
      is_active: true
    });

    await Product.create({
      name: 'T-Shirt',
      description: 'Cotton t-shirt for casual wear',
      unit: 'piece',
      category_id: clothingCategory.id,
      is_active: true
    });

    await Product.create({
      name: 'Rice',
      description: 'Premium quality basmati rice',
      unit: 'kg',
      category_id: groceryCategory.id,
      is_active: true
    });

    console.log('✅ Test data seeded successfully!');
    console.log(`
📊 Created:
   • ${await Plan.count()} Plans
   • ${await Category.count()} Categories  
   • ${await Product.count()} Products
   • ${await ShopCategory.count()} Shop-Category Assignments
`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
