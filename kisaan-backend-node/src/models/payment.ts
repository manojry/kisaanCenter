import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PaymentAttributes {
  id: number;
  transaction_id?: number | null;
  shop_id?: number | null;
  payer_type: 'BUYER' | 'SHOP';
  payee_type: 'SHOP' | 'FARMER';
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  payment_date?: Date;
  method: 'CASH' | 'BANK' | 'UPI' | 'OTHER';
  notes?: string;
  counterparty_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'status' | 'payment_date' | 'notes' | 'counterparty_id' | 'shop_id' | 'transaction_id' | 'created_at' | 'updated_at'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: number;
  public transaction_id!: number | null;
  public shop_id!: number | null;
  public payer_type!: 'BUYER' | 'SHOP';
  public payee_type!: 'SHOP' | 'FARMER';
  public amount!: number;
  public status!: 'PENDING' | 'PAID' | 'FAILED';
  public payment_date?: Date;
  public method!: 'CASH' | 'BANK' | 'UPI' | 'OTHER';
  public notes?: string;
  public counterparty_id!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Payment.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    transaction_id: { type: DataTypes.BIGINT, allowNull: true, references: { model: 'kisaan_transactions', key: 'id' } },
    shop_id: { type: DataTypes.BIGINT, allowNull: true, references: { model: 'kisaan_shops', key: 'id' } },
    payer_type: { type: DataTypes.ENUM('BUYER', 'SHOP'), allowNull: false },
    payee_type: { type: DataTypes.ENUM('SHOP', 'FARMER'), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    status: { type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED'), allowNull: false, defaultValue: 'PENDING' },
    payment_date: { type: DataTypes.DATE, allowNull: true },
    method: { type: DataTypes.ENUM('CASH', 'BANK', 'UPI', 'OTHER'), allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    counterparty_id: { type: DataTypes.BIGINT, allowNull: true, references: { model: 'kisaan_users', key: 'id' } },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'kisaan_payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['transaction_id'] },
      { fields: ['payer_type'] },
      { fields: ['payee_type'] },
      { fields: ['status'] },
      { fields: ['payment_date'] },
      { fields: ['counterparty_id'] },
      { fields: ['transaction_id', 'status'] }, // FIXED: composite index
    ]
  }
);