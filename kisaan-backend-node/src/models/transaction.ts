
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum TransactionStatus {
  Pending = 'pending',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Settled = 'settled',
}

export interface TransactionAttributes {
  id: number;
  shop_id: number;
  farmer_id: number;
  buyer_id: number;
  category_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  commission_amount: number;
  farmer_earning: number;
  product_id?: number | null;
  commission_rate?: number | null;
  commission_type?: string | null;
  status?: TransactionStatus;
  transaction_date?: Date | null;
  settlement_date?: Date | null;
  notes?: string | null;
  metadata?: object | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: number;
  public shop_id!: number;
  public farmer_id!: number;
  public buyer_id!: number;
  public category_id!: number;
  public product_name!: string;
  public quantity!: number;
  public unit_price!: number;
  public total_amount!: number;
  public commission_amount!: number;
  public farmer_earning!: number;
  public product_id?: number | null;
  public commission_rate?: number | null;
  public commission_type?: string | null;
  public status?: TransactionStatus;
  public transaction_date?: Date | null;
  public settlement_date?: Date | null;
  public notes?: string | null;
  public metadata?: object | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Transaction.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    shop_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'kisaan_shops', key: 'id' } },
    farmer_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'kisaan_users', key: 'id' } },
    buyer_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'kisaan_users', key: 'id' } },
    category_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'kisaan_categories', key: 'id' } },
    product_name: { type: DataTypes.STRING(255), allowNull: false },
    quantity: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0 } },
    unit_price: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0 } },
    total_amount: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0 } },
    commission_amount: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0 } },
    farmer_earning: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0 } },
    product_id: { type: DataTypes.BIGINT, allowNull: true, references: { model: 'kisaan_products', key: 'id' } },
    commission_rate: { type: DataTypes.DECIMAL(6,4), allowNull: true },
    commission_type: { type: DataTypes.STRING(30), allowNull: true },
    status: { type: DataTypes.ENUM(...Object.values(TransactionStatus)), allowNull: true, defaultValue: TransactionStatus.Pending },
    transaction_date: { type: DataTypes.DATE, allowNull: true },
    settlement_date: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'kisaan_transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['shop_id'] },
      { fields: ['farmer_id'] },
      { fields: ['buyer_id'] },
      { fields: ['category_id'] },
      { fields: ['created_at'] },
      { fields: ['product_id'] },
      // Composite indexes for common query patterns
      { fields: ['shop_id', 'created_at'] },
      { fields: ['farmer_id', 'created_at'] },
      { fields: ['buyer_id', 'created_at'] },
      { fields: ['shop_id', 'farmer_id'] },
      { fields: ['shop_id', 'buyer_id'] },
      { fields: ['shop_id', 'farmer_id', 'buyer_id', 'status'] },
    ],
  }
);




