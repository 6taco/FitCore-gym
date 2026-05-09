import winston from 'winston';
import env from '../config/env.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}] ${stack || message}`;
});

const logger = winston.createLogger({
  level: env.log.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    devFormat,
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
