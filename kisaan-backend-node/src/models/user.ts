import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
  id: number;
  username: string;
  password: string;
  role: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  shop_id?: number | null;
  contact?: string | null;
  email?: string | null;
  status: 'active' | 'inactive';
  balance: number;
  cumulative_value: number; // total earned (farmer), spent (buyer), commission (owner)
  created_by?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'shop_id' | 'contact' | 'email' | 'created_by' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public password!: string;
  public role!: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  public shop_id!: number | null;
  public contact!: string | null;
  public email!: string | null;
  public status!: 'active' | 'inactive';
  public balance!: number;
  public cumulative_value!: number;
  public created_by!: number | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('superadmin', 'owner', 'farmer', 'buyer'),
      allowNull: false,
    },
    shop_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: 'kisaan_shops', key: 'id' },
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    balance: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false,
      defaultValue: 0.00,
    },
    cumulative_value: {
      type: DataTypes.DECIMAL(18,2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Cumulative value: total earned (farmer), total spent (buyer), total commission (owner)'
    },
    created_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: 'kisaan_users', key: 'id' },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    },
  },
  {
    sequelize,
    tableName: 'kisaan_users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['username'] },
      { fields: ['shop_id'] },
      { fields: ['role'] },
    ],
  }
);


// ...existing code...


