import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import env from '../src/config/env.js';
import logger from '../src/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../../db/schema.sql');

async function run() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });
  logger.info(`连接到 ${env.db.host}:${env.db.port}，开始执行 schema.sql ...`);
  await conn.query(sql);
  logger.info('数据库初始化完成 ✔');
  await conn.end();
}

run().catch((err) => {
  logger.error('数据库初始化失败:', err);
  process.exit(1);
});
