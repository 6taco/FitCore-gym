import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const CheckIn = sequelize.define('CheckIn', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  member_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  check_in_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  method: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'MANUAL' },
  operator_id: { type: DataTypes.INTEGER.UNSIGNED },
  remark: { type: DataTypes.STRING(255) },
}, {
  tableName: 'check_ins',
  timestamps: false,
});

export default CheckIn;
