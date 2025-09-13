import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface BalanceSnapshotAttributes {
  id: number;
  user_id: number;
  balance: number;
  snapshot_date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BalanceSnapshotCreationAttributes extends Optional<BalanceSnapshotAttributes, 'id'> {}

class BalanceSnapshot extends Model<BalanceSnapshotAttributes, BalanceSnapshotCreationAttributes>
  implements BalanceSnapshotAttributes {
  public id!: number;
  public user_id!: number;
  public balance!: number;
  public snapshot_date!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BalanceSnapshot.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    snapshot_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'BalanceSnapshot',
    tableName: 'balance_snapshots',
    timestamps: true,
  }
);

export default BalanceSnapshot;
