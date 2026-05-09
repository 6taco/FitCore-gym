import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  type: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'SYSTEM' },
  title: { type: DataTypes.STRING(128), allowNull: false },
  content: { type: DataTypes.TEXT },
  is_read: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Notification;
