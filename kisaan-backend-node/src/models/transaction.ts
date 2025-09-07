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
  commission_rate?: number;
  commission_amount?: number;
  farmer_paid?: number;
  buyer_paid?: number;
  deficit?: number;
  status: 'pending' | 'paid' | 'partial' | 'credit' | 'farmer_due';
  transaction_date: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> {}

export class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: number;
  public shop_id!: number;
  public farmer_id!: string;
  public buyer_id!: string;
  public product_id!: number;
  public quantity!: number;
  public price!: number;
  public total!: number;
  public commission_rate?: number;
  public commission_amount?: number;
  public farmer_paid?: number;
  public buyer_paid?: number;
  public deficit?: number;
  public status!: 'pending' | 'paid' | 'partial' | 'credit' | 'farmer_due';
  public transaction_date!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Transaction.init(
  {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  shop_id: { type: DataTypes.INTEGER, allowNull: false },
    farmer_id: { type: DataTypes.STRING, allowNull: false },
    buyer_id: { type: DataTypes.STRING, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    total: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    commission_rate: { type: DataTypes.DECIMAL(5,2), allowNull: true, defaultValue: 10.00 },
    commission_amount: { type: DataTypes.DECIMAL(10,2), allowNull: true, defaultValue: 0.00 },
    farmer_paid: { type: DataTypes.DECIMAL(10,2), allowNull: true, defaultValue: 0.00 },
    buyer_paid: { type: DataTypes.DECIMAL(10,2), allowNull: true, defaultValue: 0.00 },
    deficit: { type: DataTypes.DECIMAL(10,2), allowNull: true, defaultValue: 0.00 },
    status: { type: DataTypes.ENUM('pending','paid','partial','credit','farmer_due'), allowNull: false, defaultValue: 'pending' },
    transaction_date: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'kisaan_transactions',
    timestamps: false,
  }
);




