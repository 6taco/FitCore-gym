import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface ProductAttributes {
  id: number;
  code: string;
  name: string;
  category: string | null;
  price: number;
  cost: number | null;
  stock: number;
  stock_alert: number | null;
  unit: string | null;
  status: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'category' | 'cost' | 'stock' | 'stock_alert' | 'unit' | 'status'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare id: number;
  declare code: string;
  declare name: string;
  declare category: string | null;
  declare price: number;
  declare cost: number | null;
  declare stock: number;
  declare stock_alert: number | null;
  declare unit: string | null;
  declare status: number;
  declare created_at: Date;
  declare updated_at: Date;
}

Product.init({
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
  sequelize,
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Product;
