import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_no: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  member_id: { type: DataTypes.INTEGER.UNSIGNED },
  operator_id: { type: DataTypes.INTEGER.UNSIGNED },
  total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  paid_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'PENDING' }, // PENDING / PAID / REFUNDED / CANCELLED
  remark: { type: DataTypes.STRING(255) },
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Order;
