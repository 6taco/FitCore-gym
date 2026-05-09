import ExcelJS from 'exceljs';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { Member, Membership, MembershipPlan, Order, OrderItem, Payment, Product } from '../models/index.js';
import { AppError } from '../utils/response.js';

function setHeaders(res, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
}

export async function exportMembers(req, res, next) {
  try {
    const rows = await Member.findAll({
      include: [{
        model: Membership, as: 'memberships',
        include: [{ model: MembershipPlan, as: 'plan' }],
      }],
      order: [['id', 'ASC']],
    });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('会员列表');
    ws.columns = [
      { header: '编号', key: 'member_no', width: 18 },
      { header: '姓名', key: 'name', width: 12 },
      { header: '性别', key: 'gender', width: 6 },
      { header: '手机', key: 'phone', width: 14 },
      { header: '状态', key: 'status', width: 8 },
      { header: '有效卡种', key: 'cards', width: 30 },
      { header: '注册日期', key: 'created_at', width: 14 },
    ];
    for (const m of rows) {
      const activeCards = (m.memberships || [])
        .filter((ms) => ms.status === 'ACTIVE')
        .map((ms) => ms.plan?.name || ms.card_no)
        .join('、');
      ws.addRow({
        member_no: m.member_no,
        name: m.name,
        gender: m.gender === 1 ? '男' : m.gender === 2 ? '女' : '未知',
        phone: m.phone || '',
        status: m.status === 1 ? '正常' : '停用',
        cards: activeCards || '无',
        created_at: dayjs(m.created_at).format('YYYY-MM-DD'),
      });
    }
    setHeaders(res, `会员列表_${dayjs().format('YYYYMMDD')}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
}

export async function exportOrders(req, res, next) {
  try {
    const { start, end } = req.query;
    const where = {};
    if (start) where.created_at = { ...(where.created_at || {}), [Op.gte]: dayjs(start).startOf('day').toDate() };
    if (end) where.created_at = { ...(where.created_at || {}), [Op.lte]: dayjs(end).endOf('day').toDate() };

    const rows = await Order.findAll({
      where,
      include: [
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payments' },
      ],
      order: [['id', 'DESC']],
    });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('订单列表');
    ws.columns = [
      { header: '订单号', key: 'order_no', width: 22 },
      { header: '金额', key: 'total_amount', width: 10 },
      { header: '状态', key: 'status', width: 10 },
      { header: '支付方式', key: 'methods', width: 18 },
      { header: '商品明细', key: 'items', width: 40 },
      { header: '下单时间', key: 'created_at', width: 18 },
    ];
    for (const o of rows) {
      ws.addRow({
        order_no: o.order_no,
        total_amount: Number(o.total_amount),
        status: o.status,
        methods: (o.payments || []).map((p) => p.method).join('+'),
        items: (o.items || []).map((i) => `${i.item_name}x${i.quantity}`).join('、'),
        created_at: dayjs(o.created_at).format('YYYY-MM-DD HH:mm'),
      });
    }
    setHeaders(res, `订单列表_${dayjs().format('YYYYMMDD')}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
}

export async function exportProducts(req, res, next) {
  try {
    const rows = await Product.findAll({ order: [['id', 'ASC']] });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('商品库存');
    ws.columns = [
      { header: '编码', key: 'code', width: 14 },
      { header: '名称', key: 'name', width: 18 },
      { header: '分类', key: 'category', width: 10 },
      { header: '售价', key: 'price', width: 10 },
      { header: '库存', key: 'stock', width: 8 },
      { header: '预警线', key: 'stock_alert', width: 8 },
      { header: '状态', key: 'status', width: 8 },
    ];
    for (const p of rows) {
      ws.addRow({
        code: p.code,
        name: p.name,
        category: p.category || '',
        price: Number(p.price),
        stock: p.stock,
        stock_alert: p.stock_alert ?? '',
        status: p.status === 1 ? '在售' : '下架',
      });
    }
    setHeaders(res, `商品库存_${dayjs().format('YYYYMMDD')}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
}
