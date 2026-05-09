import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Membership = sequelize.define('Membership', {
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
  tableName: 'memberships',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Membership;
