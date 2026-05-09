import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const StockMovement = sequelize.define('StockMovement', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  type: { type: DataTypes.STRING(16), allowNull: false }, // IN / OUT / ADJUST
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  before_stock: { type: DataTypes.INTEGER, allowNull: false },
  after_stock: { type: DataTypes.INTEGER, allowNull: false },
  ref_type: { type: DataTypes.STRING(32) },
  ref_id: { type: DataTypes.INTEGER.UNSIGNED },
  remark: { type: DataTypes.STRING(255) },
  operator_id: { type: DataTypes.INTEGER.UNSIGNED },
}, {
  tableName: 'stock_movements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default StockMovement;
