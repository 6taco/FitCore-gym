import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const AuditLog = sequelize.define('AuditLog', {
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
  tableName: 'audit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default AuditLog;
