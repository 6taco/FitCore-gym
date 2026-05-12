import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface PaymentAttributes {
  id: number;
  order_id: number;
  method: string;
  amount: number;
  trade_no: string | null;
  status: string;
  paid_at: Date | null;
}

export interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'trade_no' | 'status' | 'paid_at'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  declare id: number;
  declare order_id: number;
  declare method: string;
  declare amount: number;
  declare trade_no: string | null;
  declare status: string;
  declare paid_at: Date | null;
}

Payment.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  method: { type: DataTypes.STRING(16), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  trade_no: { type: DataTypes.STRING(64) },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'SUCCESS' },
  paid_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  sequelize,
  tableName: 'payments',
  timestamps: false,
});

export default Payment;
