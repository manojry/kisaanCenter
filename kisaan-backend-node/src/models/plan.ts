import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PlanAttributes {
  id: number;
  name: string;
  description?: string | null;
  max_users?: number | null;
  max_products?: number | null;
  max_transactions?: number | null;
  price: number;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  features: string; // JSON string of features array
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface PlanCreationAttributes extends Optional<PlanAttributes, 'id' | 'description' | 'max_users' | 'max_products' | 'max_transactions' | 'is_active' | 'created_at' | 'updated_at'> {}

export class Plan extends Model<PlanAttributes, PlanCreationAttributes> implements PlanAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public max_users!: number | null;
  public max_products!: number | null;
  public max_transactions!: number | null;
  public price!: number;
  public billing_cycle!: 'monthly' | 'quarterly' | 'yearly';
  public features!: string;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Plan.init(
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
    max_users: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_products: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_transactions: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    billing_cycle: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'yearly'),
      allowNull: false,
      defaultValue: 'monthly',
    },
    features: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'plans',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['name'] },
      { fields: ['is_active'] },
      { fields: ['billing_cycle'] },
      { fields: ['price'] },
    ],
  }
);

export default Plan;
