import { Setting } from '../models/index.js';
import { success, AppError } from '../utils/response.js';

export async function listSettings(req, res, next) {
  try {
    const rows = await Setting.findAll({ order: [['group', 'ASC'], ['id', 'ASC']] });
    const grouped = {};
    for (const r of rows) {
      const g = r.group || 'general';
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push({ key: r.key, value: r.value, label: r.label });
    }
    res.json(success(grouped));
  } catch (err) { next(err); }
}

export async function updateSettings(req, res, next) {
  try {
    const items = req.body; // { key: value, ... }
    if (!items || typeof items !== 'object') throw new AppError('参数格式错误', 400);
    for (const [key, value] of Object.entries(items)) {
      await Setting.update({ value: String(value) }, { where: { key } });
    }
    res.json(success(null, '设置已保存'));
  } catch (err) { next(err); }
}

// 获取单个设置值的工具函数
export async function getSettingValue(key, defaultValue = null) {
  const row = await Setting.findOne({ where: { key } });
  return row ? row.value : defaultValue;
}

export async function getSettingValues(keys = []) {
  if (!Array.isArray(keys) || keys.length === 0) return {};
  const rows = await Setting.findAll({ where: { key: keys } });
  const map = {};
  rows.forEach((r) => { map[r.key] = r.value; });
  return map;
}
