import { Product } from '../models/product';
import { Category } from '../models/category';
import { ProductCreate, ProductUpdate } from '../schemas/product';
import { Op } from 'sequelize';

export const createProduct = async (data: ProductCreate): Promise<Product> => {
  const product = await Product.create({
    name: data.name,
    description: data.description ?? null,
    category_id: data.category_id,
    unit: data.unit ?? null,
  });
  return product;
};

export const getAllProducts = async (activeOnly: boolean = false, categoryId?: number): Promise<Product[]> => {
  const where: any = {};
  if (activeOnly) where.is_active = true;
  if (categoryId) where.category_id = categoryId;
  
  const products = await Product.findAll({ 
    where,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'description']
      }
    ],
    order: [['name', 'ASC']]
  });
  return products;
};

export const getProductById = async (id: number): Promise<Product | null> => {
  const product = await Product.findByPk(id, {
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'description']
      }
    ]
  });
  return product;
};

export const updateProduct = async (id: number, data: ProductUpdate): Promise<Product | null> => {
  const product = await Product.findByPk(id);
  if (!product) return null;

  const updateData: any = { ...data };
  
  // Convert null fields properly
  if (data.description === null) {
    updateData.description = null;
  }
  if (data.unit === null) {
    updateData.unit = null;
  }

  await product.update(updateData);
  return product;
};

export const deleteProduct = async (id: number): Promise<boolean> => {
  const product = await Product.findByPk(id);
  if (!product) return false;

  await product.destroy();
  return true;
};

export const deactivateProduct = async (id: number): Promise<Product | null> => {
  const product = await Product.findByPk(id);
  if (!product) return null;

  await product.update({ record_status: 'inactive' });
  return product;
};

export const getActiveProducts = async (categoryId?: number): Promise<Product[]> => {
  return getAllProducts(true, categoryId);
};

export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  const products = await Product.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { description: { [Op.iLike]: `%${searchTerm}%` } }
      ]
    },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'description']
      }
    ],
    order: [['name', 'ASC']]
  });
  return products;
};

export const getProductsByCategory = async (categoryId: number, activeOnly: boolean = false): Promise<Product[]> => {
  return getAllProducts(activeOnly, categoryId);
};

export const bulkCreateProducts = async (products: ProductCreate[]): Promise<Product[]> => {
  const createdProducts = await Product.bulkCreate(
    products.map(product => ({
      name: product.name,
      description: product.description ?? null,
      category_id: product.category_id,
      unit: product.unit ?? null,
      is_active: product.is_active ?? true,
    }))
  );
  return createdProducts;
};
