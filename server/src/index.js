import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import { connectDB } from './config/db.js';
import { scheduleExpireJob } from './jobs/expireMemberships.js';

async function bootstrap() {
  try {
    await connectDB();
    scheduleExpireJob();
    app.listen(env.port, () => {
      logger.info(`API 服务已启动：http://localhost:${env.port}`);
      logger.info(`健康检查：http://localhost:${env.port}/api/health`);
    });
  } catch (err) {
    logger.error('启动失败:', err);
    process.exit(1);
  }
}

bootstrap();
