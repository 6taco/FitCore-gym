import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(64), allowNull: false },
  category: { type: DataTypes.STRING(32) },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  cost: { type: DataTypes.DECIMAL(10, 2) },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  stock_alert: { type: DataTypes.INTEGER, defaultValue: null },
  unit: { type: DataTypes.STRING(16), defaultValue: '件' },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Product;
