import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Booking = sequelize.define('Booking', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  schedule_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  member_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'BOOKED' }, // BOOKED / CHECKED_IN / CANCELLED / NO_SHOW
  checked_in_at: { type: DataTypes.DATE },
  remark: { type: DataTypes.STRING(255) },
}, {
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Booking;
