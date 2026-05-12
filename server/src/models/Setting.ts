import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface SettingAttributes {
  id: number;
  key: string;
  value: string | null;
  label: string | null;
  group: string;
  updated_at?: Date;
}

export interface SettingCreationAttributes extends Optional<SettingAttributes, 'id' | 'value' | 'label' | 'group'> {}

class Setting extends Model<SettingAttributes, SettingCreationAttributes> implements SettingAttributes {
  declare id: number;
  declare key: string;
  declare value: string | null;
  declare label: string | null;
  declare group: string;
  declare updated_at: Date;
}

Setting.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  value: { type: DataTypes.TEXT },
  label: { type: DataTypes.STRING(128) },
  group: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'general' },
}, {
  sequelize,
  tableName: 'settings',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
});

export default Setting;
