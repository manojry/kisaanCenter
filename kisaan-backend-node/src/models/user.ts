import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Simplified to align with current physical DB columns
export interface UserAttributes {
  id: number;
  username: string;
  password: string;
  role: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  shop_id?: number | null;
  email?: string | null;
  firstname?: string | null;
  contact?: string | null;
  balance: number; // running balance (positive: platform owes user, negative: user owes platform)
  created_by?: number | null;
  custom_commission_rate?: number | null; // user-level override (e.g., farmer specific)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'shop_id' | 'email' | 'created_by' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public password!: string;
  public role!: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  public shop_id!: number | null;
  public email!: string | null;
  public firstname!: string | null;
  public contact!: string | null;
  public balance!: number;
  public created_by!: number | null;
  public custom_commission_rate!: number | null;
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
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: true,
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
    custom_commission_rate: {
      type: DataTypes.DECIMAL(6,2),
      allowNull: true,
      defaultValue: null,
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
      // Composite indexes for common queries
      { fields: ['shop_id', 'role'] },
      { fields: ['shop_id', 'created_at'] },
    ],
  }
);


// ...existing code...


