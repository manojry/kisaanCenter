import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum SettlementReason {
  Overpayment = 'overpayment',
  Underpayment = 'underpayment',
  Adjustment = 'adjustment',
  Expense = 'expense',
  Advance = 'advance',
}

export enum SettlementStatus {
  Pending = 'pending',
  Settled = 'settled',
}

interface SettlementAttributes {
  id: number;
  shop_id: number;
  user_id: number;
  amount: number;
  reason: SettlementReason;
  status: SettlementStatus;
  settlement_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface SettlementCreationAttributes extends Optional<SettlementAttributes, 'id' | 'settlement_date' | 'created_at' | 'updated_at'> {}

export class Settlement extends Model<SettlementAttributes, SettlementCreationAttributes> implements SettlementAttributes {
  public id!: number;
  public shop_id!: number;
  public user_id!: number;
  public amount!: number;
  public reason!: SettlementReason;
  public status!: SettlementStatus;
  public settlement_date?: Date;
  public created_at!: Date;
  public updated_at!: Date;
}

Settlement.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    shop_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'kisaan_shops', key: 'id' } },
    user_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'kisaan_users', key: 'id' } },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    reason: { type: DataTypes.ENUM(...Object.values(SettlementReason)), allowNull: false },
    status: { type: DataTypes.ENUM(...Object.values(SettlementStatus)), allowNull: false, defaultValue: SettlementStatus.Pending },
    settlement_date: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'kisaan_settlements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['shop_id', 'user_id', 'reason', 'status'] },
    ],
  }
);