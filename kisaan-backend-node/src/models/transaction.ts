
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TransactionAttributes {
  id: number;
  shop_id: number;
  farmer_id: number;
  buyer_id: number;
  category_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_sale_value: number;
  shop_commission: number;
  farmer_earning: number;
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
  public total_sale_value!: number;
  public shop_commission!: number;
  public farmer_earning!: number;
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
    total_sale_value: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0 } },
    shop_commission: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0 } },
    farmer_earning: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0 } },
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
      { fields: ['category_id'] },
      { fields: ['created_at'] }
    ]
  }
);




