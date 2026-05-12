import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface RoleAttributes {
  id: number;
  code: string;
  name: string;
  description: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'description'> {}

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare id: number;
  declare code: string;
  declare name: string;
  declare description: string | null;
  declare created_at: Date;
  declare updated_at: Date;

  // associations
  declare permissions?: import('./Permission.js').default[];
  declare setPermissions: (ids: number[]) => Promise<void>;
}

Role.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(64), allowNull: false },
  description: { type: DataTypes.STRING(255) },
}, {
  sequelize,
  tableName: 'roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Role;
