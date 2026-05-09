import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Course = sequelize.define('Course', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(64), allowNull: false },
  type: { type: DataTypes.STRING(16), allowNull: false }, // GROUP / PERSONAL
  duration_min: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
  capacity: { type: DataTypes.INTEGER },
  price: { type: DataTypes.DECIMAL(10, 2) },
  description: { type: DataTypes.STRING(1000) },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
}, {
  tableName: 'courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Course;
