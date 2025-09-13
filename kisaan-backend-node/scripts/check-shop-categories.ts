import { sequelize } from '../src/models/index';

async function checkShopCategories() {
  try {
    console.log('🔍 Checking shop categories status...\n');
    
    // Get all shops with their categories
    const [results] = await sequelize.query(`
      SELECT 
        s.id as shop_id,
        s.name as shop_name,
        s.owner_id,
        COUNT(sc.category_id) as category_count,
        STRING_AGG(c.name, ', ') as categories
      FROM kisaan_shops s
      LEFT JOIN kisaan_shop_categories sc ON s.id = sc.shop_id AND sc.is_active = true
      LEFT JOIN kisaan_categories c ON sc.category_id = c.id
      WHERE s.status = 'active'
      GROUP BY s.id, s.name, s.owner_id
      ORDER BY s.id
    `);
    
    console.log('📊 Shop Categories Status:');
    console.log('=' .repeat(80));
    
    for (const row of results as any[]) {
      console.log(`🏪 Shop: ${row.shop_name} (ID: ${row.shop_id}, Owner: ${row.owner_id})`);
      console.log(`   Categories: ${row.category_count} assigned`);
      if (row.categories) {
        console.log(`   Details: ${row.categories}`);
      } else {
        console.log(`   ⚠️  NO CATEGORIES ASSIGNED - This will cause empty available products!`);
      }
      console.log('');
    }
    
    // Check available products for each shop
    console.log('🔍 Available Products Check:');
    console.log('=' .repeat(80));
    
    for (const row of results as any[]) {
      const [productCount] = await sequelize.query(`
        SELECT COUNT(*) as available_count
        FROM kisaan_products p
        LEFT JOIN kisaan_categories c ON p.category_id = c.id
        WHERE p.record_status = 'active'
        AND p.id NOT IN (
          SELECT sp.product_id 
          FROM kisaan_shop_products sp 
          WHERE sp.shop_id = :shopId AND sp.is_active = true
        )
        ${row.category_count > 0 ? `
        AND p.category_id IN (
          SELECT sc.category_id 
          FROM kisaan_shop_categories sc 
          WHERE sc.shop_id = :shopId AND sc.is_active = true
        )` : ''}
      `, { replacements: { shopId: row.shop_id } });
      
      const count = (productCount as any)[0].available_count;
      console.log(`🏪 ${row.shop_name}: ${count} available products for assignment`);
    }
    
  } catch (error) {
    console.error('❌ Error checking shop categories:', error);
  } finally {
    await sequelize.close();
  }
}

checkShopCategories();