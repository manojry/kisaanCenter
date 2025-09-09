import { Category } from '../models/category';
import { CategoryCreate, CategoryUpdate } from '../schemas/category';
import { Op } from 'sequelize';

export const createCategory = async (data: CategoryCreate): Promise<Category> => {
  const category = await Category.create({
    name: data.name,
    description: data.description ?? null,
  });
  return category;
};

export const getAllCategories = async (activeOnly: boolean = false): Promise<Category[]> => {
  const where: any = {};
  if (activeOnly) where.is_active = true;
  
  const categories = await Category.findAll({ 
    where,
    order: [['name', 'ASC']]
  });
  return categories;
};

export const getCategoryById = async (id: number): Promise<Category | null> => {
  const category = await Category.findByPk(id);
  return category;
};

export const updateCategory = async (id: number, data: CategoryUpdate): Promise<Category | null> => {
  const category = await Category.findByPk(id);
  if (!category) return null;

  const updateData: any = { ...data };
  
  // Convert null description to undefined for update
  if (data.description === null) {
    updateData.description = null;
  }

  await category.update(updateData);
  return category;
};

export const deleteCategory = async (id: number): Promise<boolean> => {
  const category = await Category.findByPk(id);
  if (!category) return false;

  await category.destroy();
  return true;
};

export const deactivateCategory = async (id: number): Promise<Category | null> => {
  const category = await Category.findByPk(id);
  if (!category) return null;

  await category.update({ status: 'inactive' });
  return category;
};

export const getActiveCategories = async (): Promise<Category[]> => {
  return getAllCategories(true);
};

export const searchCategories = async (searchTerm: string): Promise<Category[]> => {
  const categories = await Category.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { description: { [Op.iLike]: `%${searchTerm}%` } }
      ]
    },
    order: [['name', 'ASC']]
  });
  return categories;
};

export const reorderCategories = async (categoryOrders: { id: number; display_order: number }[]): Promise<boolean> => {
  try {
    for (const item of categoryOrders) {
      await Category.update(
        { /* display_order: item.display_order */ },
        { where: { id: item.id } }
      );
    }
    return true;
  } catch (error) {
    return false;
  }
};
