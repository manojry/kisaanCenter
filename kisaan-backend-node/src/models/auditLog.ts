import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AuditLogAttributes {
  id: number;
  shop_id: number;
  user_id: number;
  action: 'stock_declaration' | 'stock_adjustment' | 'transaction_created' | 'payment_recorded';
  entity_type: 'stock' | 'transaction' | 'payment';
  entity_id: number;
  old_values?: string;
  new_values?: string;
  created_at?: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'old_values' | 'new_values' | 'created_at'> {}

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: number;
  public shop_id!: number;
  public user_id!: number;
  public action!: 'stock_declaration' | 'stock_adjustment' | 'transaction_created' | 'payment_recorded';
  public entity_type!: 'stock' | 'transaction' | 'payment';
  public entity_id!: number;
  public old_values?: string;
  public new_values?: string;
  public readonly created_at!: Date;
}

AuditLog.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    shop_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'kisaan_shops', key: 'id' } },
    user_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'kisaan_users', key: 'id' } },
    action: { type: DataTypes.ENUM('stock_declaration', 'stock_adjustment', 'transaction_created', 'payment_recorded'), allowNull: false },
    entity_type: { type: DataTypes.ENUM('stock', 'transaction', 'payment'), allowNull: false },
    entity_id: { type: DataTypes.BIGINT, allowNull: false },
    old_values: { type: DataTypes.TEXT, allowNull: true },
    new_values: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'kisaan_audit_logs',
    timestamps: false,
    indexes: [
      { fields: ['shop_id'] },
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['created_at'] }
    ]
  }
);