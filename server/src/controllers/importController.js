import ExcelJS from 'exceljs';
import { sequelize, Member } from '../models/index.js';
import { success, AppError } from '../utils/response.js';
import { genNo } from '../utils/idGen.js';

export async function importMembers(req, res, next) {
  try {
    if (!req.file) throw new AppError('未上传文件', 400);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer);
    const ws = wb.worksheets[0];
    if (!ws) throw new AppError('Excel 文件为空', 400);

    const rows = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头
      const name = String(row.getCell(1).value || '').trim();
      const genderStr = String(row.getCell(2).value || '').trim();
      const phone = String(row.getCell(3).value || '').trim();
      const birthday = String(row.getCell(4).value || '').trim() || null;
      const tags = String(row.getCell(5).value || '').trim() || null;

      if (!name) return; // 跳过空行

      let gender = 0;
      if (genderStr === '男' || genderStr === '1') gender = 1;
      else if (genderStr === '女' || genderStr === '2') gender = 2;

      rows.push({ name, gender, phone: phone || null, birthday, tags });
    });

    if (rows.length === 0) throw new AppError('未找到有效数据行', 400);

    const results = { success: 0, skipped: 0, errors: [] };
    const t = await sequelize.transaction();
    try {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
          // 手机号去重
          if (r.phone) {
            const dup = await Member.findOne({ where: { phone: r.phone }, transaction: t });
            if (dup) {
              results.skipped++;
              results.errors.push(`第${i + 2}行：手机号 ${r.phone} 已存在，跳过`);
              continue;
            }
          }
          let member_no;
          for (let retry = 0; retry < 10; retry++) {
            member_no = genNo('M');
            const exists = await Member.findOne({ where: { member_no }, transaction: t });
            if (!exists) break;
            if (retry === 9) throw new Error('无法生成唯一编号');
          }
          await Member.create({ member_no, ...r, status: 1 }, { transaction: t });
          results.success++;
        } catch (err) {
          results.skipped++;
          results.errors.push(`第${i + 2}行：${err.message}`);
        }
      }
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    res.json(success(results, `导入完成：成功 ${results.success}，跳过 ${results.skipped}`));
  } catch (err) { next(err); }
}
