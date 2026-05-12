import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface StockMovementAttributes {
  id: number;
  product_id: number;
  type: string;
  quantity: number;
  before_stock: number;
  after_stock: number;
  ref_type: string | null;
  ref_id: number | null;
  remark: string | null;
  operator_id: number | null;
  created_at?: Date;
}

export interface StockMovementCreationAttributes extends Optional<StockMovementAttributes, 'id' | 'ref_type' | 'ref_id' | 'remark' | 'operator_id'> {}

class StockMovement extends Model<StockMovementAttributes, StockMovementCreationAttributes> implements StockMovementAttributes {
  declare id: number;
  declare product_id: number;
  declare type: string;
  declare quantity: number;
  declare before_stock: number;
  declare after_stock: number;
  declare ref_type: string | null;
  declare ref_id: number | null;
  declare remark: string | null;
  declare operator_id: number | null;
  declare created_at: Date;
}

StockMovement.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  type: { type: DataTypes.STRING(16), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  before_stock: { type: DataTypes.INTEGER, allowNull: false },
  after_stock: { type: DataTypes.INTEGER, allowNull: false },
  ref_type: { type: DataTypes.STRING(32) },
  ref_id: { type: DataTypes.INTEGER.UNSIGNED },
  remark: { type: DataTypes.STRING(255) },
  operator_id: { type: DataTypes.INTEGER.UNSIGNED },
}, {
  sequelize,
  tableName: 'stock_movements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default StockMovement;
