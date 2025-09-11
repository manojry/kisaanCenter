import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PlanAttributes {
  id: number;
  name: string;
  description?: string | null;
  price?: number | null;
  monthly_price?: number | null;
  quarterly_price?: number | null;
  yearly_price?: number | null;
  max_farmers?: number | null;
  max_buyers?: number | null;
  max_transactions?: number | null;
  data_retention_months?: number | null;
  features: string; // JSON string of features array
  status?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface PlanCreationAttributes extends Optional<
  PlanAttributes,
  'id' | 'description' | 'price' | 'monthly_price' | 'quarterly_price' | 'yearly_price' | 'max_farmers' | 'max_buyers' | 'max_transactions' | 'data_retention_months' | 'features' | 'status' | 'created_at' | 'updated_at'
> {}

export class Plan extends Model<PlanAttributes, PlanCreationAttributes> implements PlanAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public price!: number | null;
  public monthly_price!: number | null;
  public quarterly_price!: number | null;
  public yearly_price!: number | null;
  public max_farmers!: number | null;
  public max_buyers!: number | null;
  public max_transactions!: number | null;
  public data_retention_months!: number | null;
  public features!: string;
  public status?: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Plan.init(
  {
    id: {
      type: DataTypes.BIGINT,
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
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    sequelize,
    tableName: 'kisaan_plans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);


