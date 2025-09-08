import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Settlement extends Model {
  static associate?: (models: any) => void;
  public id!: number;
  public shop_id!: number;
  public user_id!: string;
  public user_type!: 'farmer' | 'buyer';
  public transaction_id?: number;
  public amount!: number;
  public type!: 'overpayment' | 'underpayment' | 'settlement' | 'expense' | 'payment_received' | 'payment_made';
  public description!: string;
  public status!: 'pending' | 'settled';
  public settled_amount!: number;
  public balance!: number;
  public settlement_date?: Date;
  public created_at!: Date;
  public updated_at!: Date;
}

Settlement.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  shop_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_type: {
    type: DataTypes.ENUM('farmer', 'buyer'),
    allowNull: false,
  },
  transaction_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('overpayment', 'underpayment', 'settlement', 'expense', 'payment_received', 'payment_made'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'settled'),
    defaultValue: 'pending',
  },
  settled_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  settlement_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'settlements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Define associations
Settlement.associate = (models) => {
  Settlement.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  Settlement.belongsTo(models.Shop, {
    foreignKey: 'shop_id',
    as: 'shop'
  });
  Settlement.belongsTo(models.Transaction, {
    foreignKey: 'transaction_id',
    as: 'transaction'
  });
};