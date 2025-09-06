// Test utility to clear test data for plans, categories, and shop-category assignments

import { Plan } from '../src/models/plan';
import { Category } from '../src/models/category';
import { ShopCategory } from '../src/models/shopCategory';
import { Op } from 'sequelize';

export async function clearTestData() {
  // Remove test plans
  await Plan.destroy({
    where: {
      name: {
        [Op.or]: ['Test Plan', 'Flow Test Plan']
      }
    }
  });
  // Remove test categories
  await Category.destroy({
    where: {
      name: {
        [Op.or]: ['Test Category', 'Flow Test Category']
      }
    }
  });
  // Remove all shop-category assignments (for test isolation)
  await ShopCategory.destroy({ where: {} });
}
