import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  method: { type: DataTypes.STRING(16), allowNull: false }, // CASH / WECHAT / ALIPAY / CARD / STORED
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  trade_no: { type: DataTypes.STRING(64) },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'SUCCESS' }, // PENDING / SUCCESS / REFUNDED
  paid_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'payments',
  timestamps: false,
});

export default Payment;
