import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface BookingAttributes {
  id: number;
  schedule_id: number;
  member_id: number;
  status: string;
  checked_in_at: Date | null;
  remark: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface BookingCreationAttributes extends Optional<BookingAttributes, 'id' | 'status' | 'checked_in_at' | 'remark'> {}

class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
  declare id: number;
  declare schedule_id: number;
  declare member_id: number;
  declare status: string;
  declare checked_in_at: Date | null;
  declare remark: string | null;
  declare created_at: Date;
  declare updated_at: Date;

  // associations
  declare schedule?: import('./CourseSchedule.js').default;
  declare member?: import('./Member.js').default;
}

Booking.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  schedule_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  member_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'BOOKED' },
  checked_in_at: { type: DataTypes.DATE },
  remark: { type: DataTypes.STRING(255) },
}, {
  sequelize,
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Booking;
