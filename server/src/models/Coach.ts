import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface CoachAttributes {
  id: number;
  user_id: number | null;
  name: string;
  gender: number | null;
  phone: string | null;
  avatar: string | null;
  specialty: string | null;
  intro: string | null;
  hire_date: string | null;
  status: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CoachCreationAttributes extends Optional<CoachAttributes, 'id' | 'user_id' | 'gender' | 'phone' | 'avatar' | 'specialty' | 'intro' | 'hire_date' | 'status'> {}

class Coach extends Model<CoachAttributes, CoachCreationAttributes> implements CoachAttributes {
  declare id: number;
  declare user_id: number | null;
  declare name: string;
  declare gender: number | null;
  declare phone: string | null;
  declare avatar: string | null;
  declare specialty: string | null;
  declare intro: string | null;
  declare hire_date: string | null;
  declare status: number;
  declare created_at: Date;
  declare updated_at: Date;
}

Coach.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED },
  name: { type: DataTypes.STRING(64), allowNull: false },
  gender: { type: DataTypes.TINYINT, defaultValue: 0 },
  phone: { type: DataTypes.STRING(20) },
  avatar: { type: DataTypes.STRING(255) },
  specialty: { type: DataTypes.STRING(255) },
  intro: { type: DataTypes.STRING(1000) },
  hire_date: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
}, {
  sequelize,
  tableName: 'coaches',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Coach;
