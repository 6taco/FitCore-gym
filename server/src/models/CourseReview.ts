import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface CourseReviewAttributes {
  id: number;
  schedule_id: number;
  member_id: number;
  rating: number;
  content: string | null;
  created_at?: Date;
}

export interface CourseReviewCreationAttributes extends Optional<CourseReviewAttributes, 'id' | 'rating' | 'content'> {}

class CourseReview extends Model<CourseReviewAttributes, CourseReviewCreationAttributes> implements CourseReviewAttributes {
  declare id: number;
  declare schedule_id: number;
  declare member_id: number;
  declare rating: number;
  declare content: string | null;
  declare created_at: Date;

  // associations
  declare schedule?: import('./CourseSchedule.js').default;
  declare member?: import('./Member.js').default;
}

CourseReview.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  schedule_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  member_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 5 },
  content: { type: DataTypes.STRING(500) },
}, {
  sequelize,
  tableName: 'course_reviews',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default CourseReview;
