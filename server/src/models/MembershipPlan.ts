import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface MembershipPlanAttributes {
  id: number;
  code: string;
  name: string;
  type: string;
  price: number;
  duration_days: number | null;
  total_count: number | null;
  initial_balance: number | null;
  description: string | null;
  status: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface MembershipPlanCreationAttributes extends Optional<MembershipPlanAttributes, 'id' | 'duration_days' | 'total_count' | 'initial_balance' | 'description' | 'status'> {}

class MembershipPlan extends Model<MembershipPlanAttributes, MembershipPlanCreationAttributes> implements MembershipPlanAttributes {
  declare id: number;
  declare code: string;
  declare name: string;
  declare type: string;
  declare price: number;
  declare duration_days: number | null;
  declare total_count: number | null;
  declare initial_balance: number | null;
  declare description: string | null;
  declare status: number;
  declare created_at: Date;
  declare updated_at: Date;
}

MembershipPlan.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(64), allowNull: false },
  type: { type: DataTypes.STRING(16), allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  duration_days: { type: DataTypes.INTEGER },
  total_count: { type: DataTypes.INTEGER },
  initial_balance: { type: DataTypes.DECIMAL(10, 2) },
  description: { type: DataTypes.STRING(500) },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
}, {
  sequelize,
  tableName: 'membership_plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default MembershipPlan;
