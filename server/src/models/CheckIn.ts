import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface CheckInAttributes {
  id: number;
  member_id: number;
  check_in_at: Date;
  method: string;
  operator_id: number | null;
  remark: string | null;
}

export interface CheckInCreationAttributes extends Optional<CheckInAttributes, 'id' | 'check_in_at' | 'method' | 'operator_id' | 'remark'> {}

class CheckIn extends Model<CheckInAttributes, CheckInCreationAttributes> implements CheckInAttributes {
  declare id: number;
  declare member_id: number;
  declare check_in_at: Date;
  declare method: string;
  declare operator_id: number | null;
  declare remark: string | null;

  // associations
  declare member?: import('./Member.js').default;
}

CheckIn.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  member_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  check_in_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  method: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'MANUAL' },
  operator_id: { type: DataTypes.INTEGER.UNSIGNED },
  remark: { type: DataTypes.STRING(255) },
}, {
  sequelize,
  tableName: 'check_ins',
  timestamps: false,
});

export default CheckIn;
