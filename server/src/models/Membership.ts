import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface MembershipAttributes {
  id: number;
  member_id: number;
  plan_id: number;
  card_no: string;
  start_date: string;
  end_date: string | null;
  remaining_count: number | null;
  balance: number | null;
  status: string;
  suspended_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface MembershipCreationAttributes extends Optional<MembershipAttributes, 'id' | 'end_date' | 'remaining_count' | 'balance' | 'status' | 'suspended_at'> {}

class Membership extends Model<MembershipAttributes, MembershipCreationAttributes> implements MembershipAttributes {
  declare id: number;
  declare member_id: number;
  declare plan_id: number;
  declare card_no: string;
  declare start_date: string;
  declare end_date: string | null;
  declare remaining_count: number | null;
  declare balance: number | null;
  declare status: string;
  declare suspended_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;

  // associations
  declare plan?: import('./MembershipPlan.js').default;
  declare member?: import('./Member.js').default;
}

Membership.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  member_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  plan_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  card_no: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: { type: DataTypes.DATEONLY },
  remaining_count: { type: DataTypes.INTEGER },
  balance: { type: DataTypes.DECIMAL(10, 2) },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'ACTIVE' },
  suspended_at: { type: DataTypes.DATE, defaultValue: null },
}, {
  sequelize,
  tableName: 'memberships',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Membership;
