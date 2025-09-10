import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PlanAttributes {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  max_users?: number;
  max_products?: number;
  max_transactions?: number;
  features: string; // JSON string of features array
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface PlanCreationAttributes extends Optional<
  PlanAttributes,
  'id' | 'description' | 'max_users' | 'max_products' | 'max_transactions' | 'features' | 'is_active' | 'created_at' | 'updated_at'
> {}

export class Plan extends Model<PlanAttributes, PlanCreationAttributes> implements PlanAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public price!: number;
  public billing_cycle!: 'monthly' | 'quarterly' | 'yearly';
  public max_users?: number;
  public max_products?: number;
  public max_transactions?: number;
  public features!: string;
  public is_active?: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Plan.init(
  {
    id: {
      type: DataTypes.INTEGER,
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
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    billing_cycle: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'yearly'),
      allowNull: false,
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    sequelize,
    tableName: 'kisaan_plans',
    timestamps: false,
    underscored: true,
  }
);


