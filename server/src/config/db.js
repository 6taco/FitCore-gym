import { Sequelize } from 'sequelize';
import env from './env.js';
import logger from '../utils/logger.js';

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  timezone: '+08:00',
  logging: (msg) => logger.debug(msg),
  define: {
    underscored: true,
    freezeTableName: true,
    charset: 'utf8mb4',
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export async function connectDB() {
  await sequelize.authenticate();
  logger.info(`数据库已连接: ${env.db.host}:${env.db.port}/${env.db.name}`);
}
