import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface AuditLogAttributes {
  id: number;
  user_id: number | null;
  username: string | null;
  module: string | null;
  action: string | null;
  target_type: string | null;
  target_id: string | null;
  detail: string | null;
  ip: string | null;
  created_at?: Date;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'user_id' | 'username' | 'module' | 'action' | 'target_type' | 'target_id' | 'detail' | 'ip'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  declare id: number;
  declare user_id: number | null;
  declare username: string | null;
  declare module: string | null;
  declare action: string | null;
  declare target_type: string | null;
  declare target_id: string | null;
  declare detail: string | null;
  declare ip: string | null;
  declare created_at: Date;
}

AuditLog.init({
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED },
  username: { type: DataTypes.STRING(64) },
  module: { type: DataTypes.STRING(32) },
  action: { type: DataTypes.STRING(32) },
  target_type: { type: DataTypes.STRING(32) },
  target_id: { type: DataTypes.STRING(64) },
  detail: { type: DataTypes.TEXT },
  ip: { type: DataTypes.STRING(64) },
}, {
  sequelize,
  tableName: 'audit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default AuditLog;
