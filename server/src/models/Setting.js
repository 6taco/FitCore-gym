import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Setting = sequelize.define('Setting', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  value: { type: DataTypes.TEXT },
  label: { type: DataTypes.STRING(128) },
  group: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'general' },
}, {
  tableName: 'settings',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
});

export default Setting;
