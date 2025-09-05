import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
  id: number;
  username: string;
  password: string;
  role: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  owner_id?: string | null; // null for superadmin/owner, required for farmer/buyer
  shop_id?: number | null;
  contact?: string | null;
  email?: string | null;
  status: 'active' | 'inactive';
  created_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'owner_id' | 'shop_id' | 'contact' | 'email' | 'created_by' | 'created_at' | 'updated_at'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public password!: string;
  public role!: 'superadmin' | 'owner' | 'farmer' | 'buyer';
  public owner_id!: string | null;
  public shop_id!: number | null;
  public contact!: string | null;
  public email!: string | null;
  public status!: 'active' | 'inactive';
  public created_by!: number | null;
  public created_at!: Date;
  public updated_at!: Date;
  // Add any instance methods here if needed
}

// Use Model.init as a static method
User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
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
    owner_id: {
      type: DataTypes.STRING,
      allowNull: true, // null for superadmin/owner, required for farmer/buyer
    },
    shop_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
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
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
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
    timestamps: false,
    indexes: [
      { unique: true, fields: ['username'] },
      { fields: ['shop_id'] },
      { fields: ['role'] },
    ],
  }
);

export default User;
