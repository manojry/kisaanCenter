import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PaymentAttributes {
  id: number;
  transaction_id: number;
  amount: number;
  payment_type: 'full' | 'partial' | 'credit';
  type: 'full_payment' | 'partial_payment' | 'advance';
  payment_date: Date;
  payer_id: string;
  payee_id: string;
  created_at?: Date;
  updated_at?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: number;
  public transaction_id!: number;
  public amount!: number;
  public payment_type!: 'full' | 'partial' | 'credit';
  public payment_date!: Date;
  public payer_id!: string;
  public payee_id!: string;
  public type!: 'full_payment' | 'partial_payment' | 'advance';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Payment.init(
  {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  transaction_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  payment_type: { type: DataTypes.ENUM('full','partial','credit'), allowNull: false },
  type: { type: DataTypes.ENUM('full_payment','partial_payment','advance'), allowNull: false },
    payment_date: { type: DataTypes.DATE, allowNull: false },
    payer_id: { type: DataTypes.STRING, allowNull: false },
    payee_id: { type: DataTypes.STRING, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'kisaan_payments',
    timestamps: false,
  }
);


