import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface MemberAttributes {
  id: number;
  member_no: string;
  user_id: number | null;
  wechat_openid: string | null;
  wechat_bound_at: Date | null;
  name: string;
  gender: number | null;
  birthday: string | null;
  phone: string | null;
  id_card: string | null;
  avatar: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  tags: string | null;
  remark: string | null;
  status: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface MemberCreationAttributes extends Optional<MemberAttributes, 'id' | 'user_id' | 'wechat_openid' | 'wechat_bound_at' | 'gender' | 'birthday' | 'phone' | 'id_card' | 'avatar' | 'height_cm' | 'weight_kg' | 'tags' | 'remark' | 'status'> {}

class Member extends Model<MemberAttributes, MemberCreationAttributes> implements MemberAttributes {
  declare id: number;
  declare member_no: string;
  declare user_id: number | null;
  declare wechat_openid: string | null;
  declare wechat_bound_at: Date | null;
  declare name: string;
  declare gender: number | null;
  declare birthday: string | null;
  declare phone: string | null;
  declare id_card: string | null;
  declare avatar: string | null;
  declare height_cm: number | null;
  declare weight_kg: number | null;
  declare tags: string | null;
  declare remark: string | null;
  declare status: number;
  declare created_at: Date;
  declare updated_at: Date;
}

Member.init({
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
  sequelize,
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
