import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ShopAttributes {
  id: number;
  name: string;
  owner_id: string;
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
  public address!: string;
  public contact!: string;
  public status!: 'active' | 'inactive';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Shop.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    owner_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    contact: {
      type: DataTypes.STRING(15),
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
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'kisaan_shops',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['owner_id'], name: 'kisaan_shops_owner_id_idx' },
      { fields: ['status'], name: 'kisaan_shops_status_idx' },
    ],
  }
);

export default Shop;
