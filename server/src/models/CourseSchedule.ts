import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface CourseScheduleAttributes {
  id: number;
  course_id: number;
  coach_id: number;
  start_time: Date;
  end_time: Date;
  location: string | null;
  capacity: number | null;
  booked_count: number;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CourseScheduleCreationAttributes extends Optional<CourseScheduleAttributes, 'id' | 'location' | 'capacity' | 'booked_count' | 'status'> {}

class CourseSchedule extends Model<CourseScheduleAttributes, CourseScheduleCreationAttributes> implements CourseScheduleAttributes {
  declare id: number;
  declare course_id: number;
  declare coach_id: number;
  declare start_time: Date;
  declare end_time: Date;
  declare location: string | null;
  declare capacity: number | null;
  declare booked_count: number;
  declare status: string;
  declare created_at: Date;
  declare updated_at: Date;

  // associations
  declare course?: import('./Course.js').default;
  declare coach?: import('./Coach.js').default;
}

CourseSchedule.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  course_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  coach_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  start_time: { type: DataTypes.DATE, allowNull: false },
  end_time: { type: DataTypes.DATE, allowNull: false },
  location: { type: DataTypes.STRING(64) },
  capacity: { type: DataTypes.INTEGER },
  booked_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'OPEN' },
}, {
  sequelize,
  tableName: 'course_schedules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default CourseSchedule;
