import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Coach = sequelize.define('Coach', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED },
  name: { type: DataTypes.STRING(64), allowNull: false },
  gender: { type: DataTypes.TINYINT, defaultValue: 0 },
  phone: { type: DataTypes.STRING(20) },
  avatar: { type: DataTypes.STRING(255) },
  specialty: { type: DataTypes.STRING(255) },
  intro: { type: DataTypes.STRING(1000) },
  hire_date: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
}, {
  tableName: 'coaches',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Coach;
