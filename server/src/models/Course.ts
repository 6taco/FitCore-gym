import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface CourseAttributes {
  id: number;
  code: string;
  name: string;
  type: string;
  duration_min: number;
  capacity: number | null;
  price: number | null;
  description: string | null;
  status: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CourseCreationAttributes extends Optional<CourseAttributes, 'id' | 'duration_min' | 'capacity' | 'price' | 'description' | 'status'> {}

class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  declare id: number;
  declare code: string;
  declare name: string;
  declare type: string;
  declare duration_min: number;
  declare capacity: number | null;
  declare price: number | null;
  declare description: string | null;
  declare status: number;
  declare created_at: Date;
  declare updated_at: Date;
}

Course.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(64), allowNull: false },
  type: { type: DataTypes.STRING(16), allowNull: false },
  duration_min: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
  capacity: { type: DataTypes.INTEGER },
  price: { type: DataTypes.DECIMAL(10, 2) },
  description: { type: DataTypes.STRING(1000) },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
}, {
  sequelize,
  tableName: 'courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Course;
