import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface PermissionAttributes {
  id: number;
  code: string;
  name: string;
  module: string;
  created_at?: Date;
}

export interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id'> {}

class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  declare id: number;
  declare code: string;
  declare name: string;
  declare module: string;
  declare created_at: Date;
}

Permission.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(64), allowNull: false },
  module: { type: DataTypes.STRING(32), allowNull: false },
}, {
  sequelize,
  tableName: 'permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Permission;
