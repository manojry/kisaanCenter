// Usage: node scripts/delete_category_safe.js <category_id> <replacement_category_id>
// If replacement_category_id is provided, products will be reassigned. If not, products will be deleted.

const models = require('../src/models');
const sequelize = require('../src/config/database').default;

async function main() {
  const categoryId = parseInt(process.argv[2], 10);
  const replacementId = process.argv[3] ? parseInt(process.argv[3], 10) : null;
  if (!categoryId) {
    console.error('Usage: node scripts/delete_category_safe.js <category_id> [replacement_category_id]');
    process.exit(1);
  }
  await sequelize.authenticate();
  const products = await models.Product.findAll({ where: { category_id: categoryId } });
  if (products.length > 0) {
    if (replacementId) {
      // Reassign products
      await models.Product.update({ category_id: replacementId }, { where: { category_id: categoryId } });
      console.log(`Reassigned ${products.length} products from category ${categoryId} to ${replacementId}`);
    } else {
      // Delete products
      await models.Product.destroy({ where: { category_id: categoryId } });
      console.log(`Deleted ${products.length} products in category ${categoryId}`);
    }
  } else {
    console.log('No products found for this category.');
  }
  // Now delete the category
  await models.Category.destroy({ where: { id: categoryId } });
  console.log(`Category ${categoryId} deleted.`);
  await sequelize.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
