import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ProductAttributes {
  id: number;
  name: string;
  category_id: number;
  description?: string | null;
  price?: number;
  shop_id?: number;
  record_status?: string;
  unit?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface ProductCreationAttributes extends Optional<
  ProductAttributes,
  'id' | 'description' | 'unit' | 'price' | 'shop_id' | 'record_status' | 'created_at' | 'updated_at'
> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public category_id!: number;
  public description!: string | null;
  public price?: number;
  public shop_id?: number;
  public record_status?: string;
  public unit?: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'kisaan_categories',
        key: 'id',
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    shop_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    record_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'kisaan_products',
    timestamps: false,
    indexes: [
      { fields: ['category_id'] },
      { fields: ['name', 'category_id'], unique: true },
    ],
  }
);

export default Product;
