import cron from 'node-cron';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import { Membership, MembershipPlan, Member, User, Role, Notification } from '../models/index.js';
import logger from '../utils/logger.js';

async function getStaffUserIds(): Promise<number[]> {
  try {
    const roles = await Role.findAll({ where: { code: { [Op.in]: ['admin', 'staff'] } } });
    const roleIds = roles.map((r) => r.id);
    if (!roleIds.length) return [];
    const users = await User.findAll({ where: { role_id: { [Op.in]: roleIds }, status: 1 }, attributes: ['id'] });
    return users.map((u) => u.id);
  } catch { return []; }
}

export async function runExpireOnce(): Promise<number> {
  const today = dayjs().format('YYYY-MM-DD');
  const [affected] = await Membership.update(
    { status: 'EXPIRED' },
    {
      where: {
        status: 'ACTIVE',
        end_date: { [Op.ne]: null, [Op.lt]: today },
      },
    },
  );
  if (affected > 0) logger.info(`[cron] 过期会员卡自动标记: ${affected} 张`);

  // 即将过期提醒（7天内）
  try {
    const soon = dayjs().add(7, 'day').format('YYYY-MM-DD');
    const expiringSoon: any[] = await Membership.findAll({
      where: { status: 'ACTIVE', end_date: { [Op.ne]: null, [Op.between]: [today, soon] } },
      include: [
        { model: MembershipPlan, as: 'plan', attributes: ['name'] },
        { model: Member, as: 'member', attributes: ['name', 'phone'] },
      ],
    });
    if (expiringSoon.length > 0) {
      const userIds = await getStaffUserIds();
      const notifications: any[] = [];
      for (const uid of userIds) {
        notifications.push({
          user_id: uid,
          type: 'EXPIRE',
          title: `${expiringSoon.length} 张会员卡即将到期`,
          content: expiringSoon.slice(0, 5).map((m: any) =>
            `${m.member?.name || '?'}(${m.plan?.name || '?'}) ${m.end_date}`
          ).join('；') + (expiringSoon.length > 5 ? '…' : ''),
        });
      }
      if (notifications.length) await Notification.bulkCreate(notifications);
      logger.info(`[cron] 已发送到期提醒通知给 ${userIds.length} 个员工`);
    }
  } catch (err: any) {
    logger.warn(`[cron] 到期提醒通知失败: ${err.message}`);
  }

  return affected;
}

export function scheduleExpireJob(): void {
  // 每天凌晨 2 点执行
  cron.schedule('0 2 * * *', () => {
    runExpireOnce().catch((err) => logger.error(`[cron] 过期扫描失败: ${err.message}`));
  }, { timezone: 'Asia/Shanghai' });
  // 启动时立即跑一次
  runExpireOnce().catch((err) => logger.warn(`[cron] 启动扫描失败: ${err.message}`));
  logger.info('[cron] 会员卡过期扫描任务已注册（每日 02:00 Asia/Shanghai）');
}
