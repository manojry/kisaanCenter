import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CommissionAttributes {
  id: number;
  shop_id: number;
  rate: number;
  type: 'percentage' | 'fixed';
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommissionCreationAttributes extends Optional<CommissionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Commission extends Model<CommissionAttributes, CommissionCreationAttributes> implements CommissionAttributes {
  public id!: number;
  public shop_id!: number;
  public rate!: number;
  public type!: 'percentage' | 'fixed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Commission.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    shop_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'kisaan_shops', key: 'id' } },
    rate: { type: DataTypes.DECIMAL(5,2), allowNull: false },
    type: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false, defaultValue: 'percentage' },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
  },
  {
    sequelize,
    tableName: 'kisaan_commissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['shop_id'] }
    ]
  }
);