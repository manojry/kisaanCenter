import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ProductAttributes {
  id: number;
  name: string;
  category_id: number;
  description?: string | null;
  unit?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'description' | 'unit' | 'is_active' | 'created_at' | 'updated_at'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public category_id!: number;
  public description!: string | null;
  public unit!: string | null;
  public is_active!: boolean;
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
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'kg',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'kisaan_products',
    timestamps: false,
    indexes: [
      { fields: ['category_id'] },
      { fields: ['is_active'] },
      { fields: ['name', 'category_id'], unique: true },
    ],
  }
);

export default Product;
