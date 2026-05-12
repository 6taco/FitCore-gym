import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface OrderAttributes {
  id: number;
  order_no: string;
  member_id: number | null;
  operator_id: number | null;
  total_amount: number;
  paid_amount: number;
  discount: number;
  status: string;
  remark: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'member_id' | 'operator_id' | 'paid_amount' | 'discount' | 'status' | 'remark'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  declare id: number;
  declare order_no: string;
  declare member_id: number | null;
  declare operator_id: number | null;
  declare total_amount: number;
  declare paid_amount: number;
  declare discount: number;
  declare status: string;
  declare remark: string | null;
  declare created_at: Date;
  declare updated_at: Date;

  // associations
  declare items?: import('./OrderItem.js').default[];
  declare payments?: import('./Payment.js').default[];
  declare member?: import('./Member.js').default;
}

Order.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_no: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  member_id: { type: DataTypes.INTEGER.UNSIGNED },
  operator_id: { type: DataTypes.INTEGER.UNSIGNED },
  total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  paid_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'PENDING' },
  remark: { type: DataTypes.STRING(255) },
}, {
  sequelize,
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Order;
