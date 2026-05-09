import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Permission = sequelize.define('Permission', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(64), allowNull: false },
  module: { type: DataTypes.STRING(32), allowNull: false },
}, {
  tableName: 'permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Permission;
