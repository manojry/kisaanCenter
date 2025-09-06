import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CategoryAttributes {
  id: number;
  name: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'description' | 'display_order' | 'is_active' | 'created_at' | 'updated_at'> {}

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public display_order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'kisaan_categories',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['name'] },
      { fields: ['is_active'] },
      { fields: ['display_order'] },
    ],
  }
);

export default Category;
