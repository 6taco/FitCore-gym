import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Role = sequelize.define('Role', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(64), allowNull: false },
  description: { type: DataTypes.STRING(255) },
}, {
  tableName: 'roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Role;
