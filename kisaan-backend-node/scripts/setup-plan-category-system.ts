import { Plan } from '../src/models/plan';
import { Category } from '../src/models/category';
import { Product } from '../src/models/product';
import { ShopCategory } from '../src/models/shopCategory';
import sequelize from '../src/config/database';

async function createTables() {
  try {
    console.log('🔄 Creating database tables...');

    // Step 1: Create new tables only (not modifying existing shop table)
    console.log('📝 Creating Plan table...');
    await Plan.sync({ force: true });

    console.log('📝 Creating Category table...');
    await Category.sync({ force: true });

    console.log('📝 Creating Product table...');
    await Product.sync({ force: true });

    console.log('📝 Creating ShopCategory table...');
    await ShopCategory.sync({ force: true });

    console.log('✅ All new tables created successfully!');

    // Step 2: Add plan_id column to shops table manually (nullable first)
    console.log('📝 Adding plan_id column to shops table...');
    
    try {
      await sequelize.query(`
        ALTER TABLE shops 
        ADD COLUMN IF NOT EXISTS plan_id INTEGER REFERENCES plans(id);
      `);
      console.log('✅ plan_id column added to shops table');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ plan_id column already exists in shops table');
      } else {
        throw error;
      }
    }

    // Step 3: Seed test data
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

    const enterprisePlan = await Plan.create({
      name: 'Enterprise Plan',
      description: 'Enterprise subscription for large businesses',
      max_users: null, // Unlimited
      max_products: null, // Unlimited
      max_transactions: null, // Unlimited
      price: 299.99,
      billing_cycle: 'yearly',
      features: JSON.stringify(['Unlimited everything', 'Priority support', 'Custom integrations', 'Dedicated account manager']),
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

    const booksCategory = await Category.create({
      name: 'Books',
      description: 'Books and educational materials',
      display_order: 4,
      is_active: true
    });

    const homeCategory = await Category.create({
      name: 'Home & Kitchen',
      description: 'Home appliances and kitchen items',
      display_order: 5,
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
      name: 'Laptop',
      description: 'High-performance laptop for work and gaming',
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
      name: 'Jeans',
      description: 'Denim jeans for everyday wear',
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

    await Product.create({
      name: 'Cooking Oil',
      description: 'Refined cooking oil',
      unit: 'liter',
      category_id: groceryCategory.id,
      is_active: true
    });

    await Product.create({
      name: 'Programming Book',
      description: 'Learn programming with this comprehensive guide',
      unit: 'piece',
      category_id: booksCategory.id,
      is_active: true
    });

    await Product.create({
      name: 'Microwave Oven',
      description: 'Compact microwave oven for quick cooking',
      unit: 'piece',
      category_id: homeCategory.id,
      is_active: true
    });

    console.log('✅ Test data seeded successfully!');
    
    // Display summary
    const planCount = await Plan.count();
    const categoryCount = await Category.count();
    const productCount = await Product.count();
    const shopCategoryCount = await ShopCategory.count();
    
    console.log(`
📊 Database Summary:
   • ${planCount} Plans created
   • ${categoryCount} Categories created
   • ${productCount} Products created
   • ${shopCategoryCount} Shop-Category Assignments
   
🎯 Available Plans:
   • Basic Plan (${basicPlan.id}) - $29.99/month
   • Pro Plan (${proPlan.id}) - $99.99/month
   • Enterprise Plan (${enterprisePlan.id}) - $299.99/year

🏷️ Available Categories:
   • Electronics (${electronicsCategory.id})
   • Clothing (${clothingCategory.id})
   • Grocery (${groceryCategory.id})
   • Books (${booksCategory.id})
   • Home & Kitchen (${homeCategory.id})
`);

    console.log('🚀 Database setup completed! You can now test the APIs.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
