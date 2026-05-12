import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface UserAttributes {
  id: number;
  username: string;
  password_hash: string;
  real_name: string | null;
  phone: string | null;
  avatar: string | null;
  role_id: number;
  status: number;
  last_login_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'real_name' | 'phone' | 'avatar' | 'status' | 'last_login_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare username: string;
  declare password_hash: string;
  declare real_name: string | null;
  declare phone: string | null;
  declare avatar: string | null;
  declare role_id: number;
  declare status: number;
  declare last_login_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;

  // associations
  declare role?: import('./Role.js').default;
}

User.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  real_name: { type: DataTypes.STRING(64) },
  phone: { type: DataTypes.STRING(20) },
  avatar: { type: DataTypes.STRING(255) },
  role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
  last_login_at: { type: DataTypes.DATE },
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  defaultScope: {
    attributes: { exclude: ['password_hash'] },
  },
  scopes: {
    withPassword: { attributes: { include: ['password_hash'] } },
  },
});

export default User;
