import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const RolePermission = sequelize.define('RolePermission', {
  role_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  permission_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
}, {
  tableName: 'role_permissions',
  timestamps: false,
});

export default RolePermission;
