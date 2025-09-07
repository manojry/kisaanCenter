import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ShopAttributes {
  id: number;
  name: string;
  owner_id: string;
  category_id?: number | null;
  plan_id?: number | null;
  address: string | null;
  contact: string | null;
  commission_rate?: number;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

interface ShopCreationAttributes extends Optional<ShopAttributes, 'id' | 'category_id' | 'createdAt' | 'updatedAt'> {}

export class Shop extends Model<ShopAttributes, ShopCreationAttributes> implements ShopAttributes {
  public id!: number;
  public name!: string;
  public owner_id!: string;
  public category_id!: number | null;
  public plan_id!: number | null;
  public address!: string | null;
  public contact!: string | null;
  public commission_rate?: number;
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
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'kisaan_categories',
        key: 'id',
      },
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
    commission_rate: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true,
      defaultValue: 10.00,
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


