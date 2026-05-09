import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const BodyMeasurement = sequelize.define('BodyMeasurement', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  member_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  measured_at: { type: DataTypes.DATE, allowNull: false },
  height_cm: { type: DataTypes.DECIMAL(5, 2) },
  weight_kg: { type: DataTypes.DECIMAL(5, 2) },
  body_fat: { type: DataTypes.DECIMAL(5, 2) },
  muscle_kg: { type: DataTypes.DECIMAL(5, 2) },
  bmi: { type: DataTypes.DECIMAL(5, 2) },
  remark: { type: DataTypes.STRING(500) },
}, {
  tableName: 'body_measurements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default BodyMeasurement;
