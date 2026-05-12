import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface BodyMeasurementAttributes {
  id: number;
  member_id: number;
  measured_at: Date;
  height_cm: number | null;
  weight_kg: number | null;
  body_fat: number | null;
  muscle_kg: number | null;
  bmi: number | null;
  remark: string | null;
  created_at?: Date;
}

export interface BodyMeasurementCreationAttributes extends Optional<BodyMeasurementAttributes, 'id' | 'height_cm' | 'weight_kg' | 'body_fat' | 'muscle_kg' | 'bmi' | 'remark'> {}

class BodyMeasurement extends Model<BodyMeasurementAttributes, BodyMeasurementCreationAttributes> implements BodyMeasurementAttributes {
  declare id: number;
  declare member_id: number;
  declare measured_at: Date;
  declare height_cm: number | null;
  declare weight_kg: number | null;
  declare body_fat: number | null;
  declare muscle_kg: number | null;
  declare bmi: number | null;
  declare remark: string | null;
  declare created_at: Date;
}

BodyMeasurement.init({
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
  sequelize,
  tableName: 'body_measurements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default BodyMeasurement;
