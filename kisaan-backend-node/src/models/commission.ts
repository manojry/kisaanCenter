import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CommissionAttributes {
  id: number;
  shop_id: number;
  transaction_id: number;
  amount: number;
  calculated_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface CommissionCreationAttributes extends Optional<CommissionAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Commission extends Model<CommissionAttributes, CommissionCreationAttributes> implements CommissionAttributes {
  public id!: number;
  public shop_id!: number;
  public transaction_id!: number;
  public amount!: number;
  public calculated_at!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Commission.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    shop_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    transaction_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    calculated_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'kisaan_commissions',
    timestamps: false,
  }
);

export default Commission;
