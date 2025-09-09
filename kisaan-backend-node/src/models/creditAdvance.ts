import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CreditAdvanceAttributes {
  id: number;
  user_id: number;
  shop_id: number;
  amount: number;
  issued_date: Date;
  due_date: Date;
  repaid_amount: number;
  status: 'active' | 'repaid' | 'overdue';
  created_at?: Date;
  updated_at?: Date;
}

interface CreditAdvanceCreationAttributes extends Optional<CreditAdvanceAttributes, 'id' | 'repaid_amount' | 'status' | 'created_at' | 'updated_at'> {}

export class CreditAdvance extends Model<CreditAdvanceAttributes, CreditAdvanceCreationAttributes> implements CreditAdvanceAttributes {
  public id!: number;
  public user_id!: number;
  public shop_id!: number;
  public amount!: number;
  public issued_date!: Date;
  public due_date!: Date;
  public repaid_amount!: number;
  public status!: 'active' | 'repaid' | 'overdue';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CreditAdvance.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'kisaan_users', key: 'id' } },
    shop_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'kisaan_shops', key: 'id' } },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    issued_date: { type: DataTypes.DATE, allowNull: false },
    due_date: { type: DataTypes.DATE, allowNull: false },
    repaid_amount: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM('active','repaid','overdue'), allowNull: false, defaultValue: 'active' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'kisaan_credits',
    timestamps: false,
  }
);



