import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CategoryAttributes {
  id: number;
  name: string;
  description?: string | null;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface CategoryCreationAttributes extends Optional<
  CategoryAttributes,
  'id' | 'description' | 'status' | 'created_at' | 'updated_at'
> {}

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public status?: string;
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
    status: {
      type: DataTypes.STRING,
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
    tableName: 'kisaan_categories',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['name'] },
    ],
  }
);

export default Category;
