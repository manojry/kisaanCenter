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
  created_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'shop_id' | 'contact' | 'email' | 'created_by' | 'created_at' | 'updated_at'> {}

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
  public created_by!: number | null;
  public created_at!: Date;
  public updated_at!: Date;
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
    created_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: 'kisaan_users', key: 'id' },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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


