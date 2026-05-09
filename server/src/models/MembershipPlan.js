import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const MembershipPlan = sequelize.define('MembershipPlan', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(64), allowNull: false },
  type: { type: DataTypes.STRING(16), allowNull: false }, // PERIOD / COUNT / STORED
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  duration_days: { type: DataTypes.INTEGER },
  total_count: { type: DataTypes.INTEGER },
  initial_balance: { type: DataTypes.DECIMAL(10, 2) },
  description: { type: DataTypes.STRING(500) },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
}, {
  tableName: 'membership_plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default MembershipPlan;
