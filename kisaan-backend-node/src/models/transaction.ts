import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TransactionAttributes {
  id: number;
  shop_id: number;
  farmer_id: string;
  buyer_id: string;
  product_id: number;
  quantity: number;
  price: number;
  total: number;
  type: 'sale' | 'purchase' | 'credit' | 'return';
  commission_rate?: number;
  commission_amount?: number;
  farmer_paid?: number;
  buyer_paid?: number;
  deficit?: number;
  status: 'pending' | 'completed' | 'cancelled' | 'partial' | 'credit' | 'farmer_due';
  payment_method?: 'cash' | 'credit' | 'bank_transfer' | 'upi';
  notes?: string;
  transaction_date: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'type' | 'status' | 'created_at' | 'updated_at'> {}

export class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: number;
  public shop_id!: number;
  public farmer_id!: string;
  public buyer_id!: string;
  public product_id!: number;
  public quantity!: number;
  public price!: number;
  public total!: number;
  public type!: 'sale' | 'purchase' | 'credit' | 'return';
  public commission_rate?: number;
  public commission_amount?: number;
  public farmer_paid?: number;
  public buyer_paid?: number;
  public deficit?: number;
  public status!: 'pending' | 'completed' | 'cancelled' | 'partial' | 'credit' | 'farmer_due';
  public payment_method?: 'cash' | 'credit' | 'bank_transfer' | 'upi';
  public notes?: string;
  public transaction_date!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Transaction.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    shop_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'kisaan_shops', key: 'id' } },
    farmer_id: { type: DataTypes.STRING, allowNull: false, references: { model: 'kisaan_users', key: 'id' } },
    buyer_id: { type: DataTypes.STRING, allowNull: false, references: { model: 'kisaan_users', key: 'id' } },
    product_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'kisaan_products', key: 'id' } },
    quantity: { type: DataTypes.DECIMAL(10,3), allowNull: false },
    price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    total: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    type: { type: DataTypes.ENUM('sale','purchase','credit','return'), allowNull: false, defaultValue: 'sale' },
    commission_rate: { type: DataTypes.DECIMAL(5,2), allowNull: true, defaultValue: 10.00 },
    commission_amount: { type: DataTypes.DECIMAL(12,2), allowNull: true, defaultValue: 0.00 },
    farmer_paid: { type: DataTypes.DECIMAL(12,2), allowNull: true, defaultValue: 0.00 },
    buyer_paid: { type: DataTypes.DECIMAL(12,2), allowNull: true, defaultValue: 0.00 },
    deficit: { type: DataTypes.DECIMAL(12,2), allowNull: true, defaultValue: 0.00 },
    status: { type: DataTypes.ENUM('pending','completed','cancelled','partial','credit','farmer_due'), allowNull: false, defaultValue: 'pending' },
    payment_method: { type: DataTypes.ENUM('cash','credit','bank_transfer','upi'), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    transaction_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'kisaan_transactions',
    timestamps: true,
    indexes: [
      { fields: ['shop_id'] },
      { fields: ['farmer_id'] },
      { fields: ['buyer_id'] },
      { fields: ['status'] },
      { fields: ['transaction_date'] },
      { fields: ['type'] }
    ]
  }
);




