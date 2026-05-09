import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const CourseReview = sequelize.define('CourseReview', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  schedule_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  member_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 5 },
  content: { type: DataTypes.STRING(500) },
}, {
  tableName: 'course_reviews',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default CourseReview;
