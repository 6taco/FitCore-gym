import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Member = sequelize.define('Member', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  member_no: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED },
  wechat_openid: { type: DataTypes.STRING(64), unique: true },
  wechat_bound_at: { type: DataTypes.DATE },
  name: { type: DataTypes.STRING(64), allowNull: false },
  gender: { type: DataTypes.TINYINT, defaultValue: 0 }, // 0未知 1男 2女
  birthday: { type: DataTypes.DATEONLY },
  phone: { type: DataTypes.STRING(20) },
  id_card: { type: DataTypes.STRING(32) },
  avatar: { type: DataTypes.STRING(255) },
  height_cm: { type: DataTypes.DECIMAL(5, 2) },
  weight_kg: { type: DataTypes.DECIMAL(5, 2) },
  tags: { type: DataTypes.STRING(255) },
  remark: { type: DataTypes.STRING(500) },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
}, {
  tableName: 'members',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  defaultScope: {
    attributes: { exclude: ['wechat_openid', 'wechat_bound_at'] },
  },
  scopes: {
    withWechat: {
      attributes: { include: ['wechat_openid', 'wechat_bound_at'] },
    },
  },
});

export default Member;
