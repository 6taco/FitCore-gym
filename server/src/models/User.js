import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const User = sequelize.define('User', {
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
