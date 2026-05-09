import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const CourseSchedule = sequelize.define('CourseSchedule', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  course_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  coach_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  start_time: { type: DataTypes.DATE, allowNull: false },
  end_time: { type: DataTypes.DATE, allowNull: false },
  location: { type: DataTypes.STRING(64) },
  capacity: { type: DataTypes.INTEGER },
  booked_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'OPEN' }, // OPEN / CLOSED / CANCELLED
}, {
  tableName: 'course_schedules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default CourseSchedule;
