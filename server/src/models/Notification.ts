import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface NotificationAttributes {
  id: number;
  user_id: number;
  type: string;
  title: string;
  content: string | null;
  is_read: number;
  created_at?: Date;
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'type' | 'content' | 'is_read'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  declare id: number;
  declare user_id: number;
  declare type: string;
  declare title: string;
  declare content: string | null;
  declare is_read: number;
  declare created_at: Date;
}

Notification.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  type: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'SYSTEM' },
  title: { type: DataTypes.STRING(128), allowNull: false },
  content: { type: DataTypes.TEXT },
  is_read: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
}, {
  sequelize,
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Notification;
