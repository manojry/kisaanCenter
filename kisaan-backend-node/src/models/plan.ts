import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PlanAttributes {
  id: number;
  name: string;
  description?: string | null;
  monthly_price?: number;
  quarterly_price?: number;
  yearly_price?: number;
  max_farmers?: number;
  max_buyers?: number;
  max_transactions?: number;
  data_retention_months?: number;
  features: string; // JSON string of features array
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface PlanCreationAttributes extends Optional<
  PlanAttributes,
  'id' | 'description' | 'monthly_price' | 'quarterly_price' | 'yearly_price' | 'max_farmers' | 'max_buyers' | 'max_transactions' | 'data_retention_months' | 'status' | 'created_at' | 'updated_at'
> {}

export class Plan extends Model<PlanAttributes, PlanCreationAttributes> implements PlanAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public monthly_price?: number;
  public quarterly_price?: number;
  public yearly_price?: number;
  public max_farmers?: number;
  public max_buyers?: number;
  public max_transactions?: number;
  public data_retention_months?: number;
  public features!: string;
  public status?: string;
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
    monthly_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    quarterly_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    yearly_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    max_farmers: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_buyers: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_transactions: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    data_retention_months: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    features: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
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
    }
  },
  {
    sequelize,
    tableName: 'kisaan_plans',
    timestamps: false,
    underscored: true,
  }
);


