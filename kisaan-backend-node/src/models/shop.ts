import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ShopAttributes {
  id: number;
  name: string;
  owner_id: string;
  plan_id?: number | null;
  address: string | null;
  contact: string | null;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

interface ShopCreationAttributes extends Optional<ShopAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Shop extends Model<ShopAttributes, ShopCreationAttributes> implements ShopAttributes {
  public id!: number;
  public name!: string;
  public owner_id!: string;
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
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    owner_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'plans',
        key: 'id',
      },
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
  },
  {
    sequelize,
    modelName: 'Shop',
    tableName: 'kisaan_shops',
    timestamps: true,
    indexes: [
      {
        fields: ['owner_id'],
      },
      {
        fields: ['plan_id'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default Shop;
