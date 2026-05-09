import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  item_type: { type: DataTypes.STRING(16), allowNull: false }, // PRODUCT / MEMBERSHIP / PERSONAL
  item_id: { type: DataTypes.INTEGER.UNSIGNED },
  item_name: { type: DataTypes.STRING(128), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, {
  tableName: 'order_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default OrderItem;
