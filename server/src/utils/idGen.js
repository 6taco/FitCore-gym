import dayjs from 'dayjs';

/**
 * 编号生成：前缀 + YYMMDDHHmmss + 4 位随机数（共 17 位）
 * DB UNIQUE 约束作为最终保障，调用方应循环重试。
 */
export function genNo(prefix = 'M') {
  const ts = dayjs().format('YYMMDDHHmmss');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${ts}${rand}`;
}
