import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface RolePermissionAttributes {
  role_id: number;
  permission_id: number;
}

class RolePermission extends Model<RolePermissionAttributes> implements RolePermissionAttributes {
  declare role_id: number;
  declare permission_id: number;
}

RolePermission.init({
  role_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  permission_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
}, {
  sequelize,
  tableName: 'role_permissions',
  timestamps: false,
});

export default RolePermission;
