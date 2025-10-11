import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum PaymentParty {
  Buyer = 'BUYER',
  Shop = 'SHOP',
  Farmer = 'FARMER',
}

export enum PaymentStatus {
  Pending = 'PENDING',
  Paid = 'PAID',
  Failed = 'FAILED',
}

export enum PaymentMethod {
  Cash = 'CASH',
  Bank = 'BANK',
  UPI = 'UPI',
  Other = 'OTHER',
}

export interface PaymentAttributes {
  id: number;
  transaction_id?: number | null;
  shop_id?: number | null;
  payer_type: PaymentParty;
  payee_type: PaymentParty;
  amount: number;
  status: PaymentStatus;
  payment_date?: Date;
  method: PaymentMethod;
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
  public payer_type!: PaymentParty;
  public payee_type!: PaymentParty;
  public amount!: number;
  public status!: PaymentStatus;
  public payment_date?: Date;
  public method!: PaymentMethod;
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
    payer_type: { type: DataTypes.ENUM(...Object.values(PaymentParty)), allowNull: false },
    payee_type: { type: DataTypes.ENUM(...Object.values(PaymentParty)), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    status: { type: DataTypes.ENUM(...Object.values(PaymentStatus)), allowNull: false, defaultValue: PaymentStatus.Pending },
    payment_date: { type: DataTypes.DATE, allowNull: true },
    method: { type: DataTypes.ENUM(...Object.values(PaymentMethod)), allowNull: false },
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
      { fields: ['shop_id'] },
      { fields: ['payer_type'] },
      { fields: ['payee_type'] },
      { fields: ['status'] },
      { fields: ['payment_date'] },
      { fields: ['counterparty_id'] },
      { fields: ['transaction_id', 'status'] },
      { fields: ['transaction_id', 'shop_id', 'status', 'created_at'] },
    ],
  }
);