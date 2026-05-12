import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface OrderItemAttributes {
  id: number;
  order_id: number;
  item_type: string;
  item_id: number | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at?: Date;
}

export interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id' | 'item_id' | 'quantity'> {}

class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  declare id: number;
  declare order_id: number;
  declare item_type: string;
  declare item_id: number | null;
  declare item_name: string;
  declare quantity: number;
  declare unit_price: number;
  declare subtotal: number;
  declare created_at: Date;
}

OrderItem.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  item_type: { type: DataTypes.STRING(16), allowNull: false },
  item_id: { type: DataTypes.INTEGER.UNSIGNED },
  item_name: { type: DataTypes.STRING(128), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, {
  sequelize,
  tableName: 'order_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default OrderItem;
