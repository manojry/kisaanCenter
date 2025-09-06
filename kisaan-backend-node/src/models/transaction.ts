import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TransactionAttributes {
  id: number;
  shop_id: number;
  buyer_id: string;
  product_id: number;
  quantity: number;
  price: number;
  total: number;
  status: 'pending' | 'paid' | 'partial' | 'credit';
  transaction_date: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> {}

export class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: number;
  public shop_id!: number;
  public buyer_id!: string;
  public product_id!: number;
  public quantity!: number;
  public price!: number;
  public total!: number;
  public status!: 'pending' | 'paid' | 'partial' | 'credit';
  public transaction_date!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Transaction.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    shop_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    buyer_id: { type: DataTypes.STRING, allowNull: false },
    product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    total: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    status: { type: DataTypes.ENUM('pending','paid','partial','credit'), allowNull: false, defaultValue: 'pending' },
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

export default Transaction;
