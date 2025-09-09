import { Category } from '../models/category';

export const seedCategories = async () => {
  const categories = [
    { name: 'Flowers', description: 'Fresh flowers and floral products' },
    { name: 'Fruits', description: 'Fresh fruits and fruit products' },
    { name: 'Vegetables', description: 'Fresh vegetables and vegetable products' },
    { name: 'Grains', description: 'Grains, cereals and grain products' }
  ];

  for (const categoryData of categories) {
    const [category, created] = await Category.findOrCreate({
      where: { name: categoryData.name },
      defaults: categoryData
    });
    
    if (created) {
      console.log(`Created category: ${category.name}`);
    } else {
      console.log(`Category already exists: ${category.name}`);
    }
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedCategories().then(() => {
    console.log('Category seeding completed');
    process.exit(0);
  }).catch(error => {
    console.error('Error seeding categories:', error);
    process.exit(1);
  });
}