import { sequelize } from '../src/models/index';

async function fixShopCategories() {
  try {
    console.log('🔧 Fixing shop categories assignment...');
    
    // Get all active shops
    const [shops] = await sequelize.query(
      `SELECT id, name FROM kisaan_shops WHERE status = 'active'`
    );
    
    console.log(`📊 Found ${(shops as any[]).length} active shops`);
    
    // Get all categories
    const [categories] = await sequelize.query(
      `SELECT id, name FROM kisaan_categories`
    );
    
    console.log(`📊 Found ${(categories as any[]).length} active categories`);
    
    // For each shop, ensure it has at least basic categories assigned
    for (const shop of shops as any[]) {
      console.log(`🏪 Processing shop: ${shop.name} (ID: ${shop.id})`);
      
      // Check if shop already has categories
      const [existingCategories] = await sequelize.query(
        `SELECT category_id FROM kisaan_shop_categories 
         WHERE shop_id = :shopId AND is_active = true`,
        { replacements: { shopId: shop.id } }
      );
      
      if ((existingCategories as any[]).length === 0) {
        console.log(`  ⚠️  No categories assigned to shop ${shop.name}`);
        
        // Assign first 3 categories (Fruits, Vegetables, Grains) to the shop
        const basicCategories = (categories as any[]).slice(0, 3);
        
        for (const category of basicCategories) {
          await sequelize.query(
            `INSERT INTO kisaan_shop_categories (shop_id, category_id, is_active, created_at, updated_at)
             VALUES (:shopId, :categoryId, true, NOW(), NOW())
             ON CONFLICT (shop_id, category_id) DO NOTHING`,
            { 
              replacements: { 
                shopId: shop.id, 
                categoryId: category.id 
              } 
            }
          );
          console.log(`  ✅ Assigned category: ${category.name}`);
        }
      } else {
        console.log(`  ✅ Shop already has ${(existingCategories as any[]).length} categories assigned`);
      }
    }
    
    console.log('🎉 Shop categories fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing shop categories:', error);
  } finally {
    await sequelize.close();
  }
}

fixShopCategories();