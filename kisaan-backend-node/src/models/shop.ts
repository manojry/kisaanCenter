import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ShopAttributes {
  id: number;
  name: string;
  owner_id: number;
  plan_id?: number | null;
  address: string | null;
  contact: string | null;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

interface ShopCreationAttributes extends Optional<ShopAttributes, 'id' | 'plan_id' | 'createdAt' | 'updatedAt'> {}

export class Shop extends Model<ShopAttributes, ShopCreationAttributes> implements ShopAttributes {
  public id!: number;
  public name!: string;
  public owner_id!: number;
  public plan_id!: number | null;
  public address!: string | null;
  public contact!: string | null;
  public status!: 'active' | 'inactive';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Shop.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    owner_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'kisaan_users', key: 'id' },
    },
    plan_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: 'kisaan_plans', key: 'id' },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'kisaan_shops',
    timestamps: true,
    indexes: [
      { fields: ['owner_id'] },
      { fields: ['plan_id'] },
      { fields: ['status'] },
    ],
  }
);


