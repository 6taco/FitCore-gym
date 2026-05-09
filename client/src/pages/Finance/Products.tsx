import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Space, Input, Select, Tag, Modal, Form, InputNumber,
  message, Popconfirm, Drawer, Timeline, Card,
} from 'antd';
import { PlusOutlined, ReloadOutlined, WarningOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  apiProductList, apiProductCreate, apiProductUpdate, apiProductDelete,
  apiStockChange, apiStockMovements,
  ProductItem, StockMovementItem,
} from '@/api/finance';
import { STOCK_MOVE_TYPE } from '@/config/dicts';
import { exportProducts } from '@/api/export';
import dayjs from 'dayjs';

export default function Products() {
  const [data, setData] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [warnOnly, setWarnOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [form] = Form.useForm();

  // 库存变动
  const [stockOpen, setStockOpen] = useState(false);
  const [stockTarget, setStockTarget] = useState<ProductItem | null>(null);
  const [stockForm] = Form.useForm();

  // 流水抽屉
  const [mvOpen, setMvOpen] = useState(false);
  const [mvTarget, setMvTarget] = useState<ProductItem | null>(null);
  const [movements, setMovements] = useState<StockMovementItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiProductList({ page, pageSize, keyword: keyword || undefined, warn: warnOnly ? '1' : undefined });
      setData(res.list);
      setTotal(res.total);
    } finally { setLoading(false); }
  }, [keyword, warnOnly, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); form.resetFields(); setFormOpen(true); };
  const openEdit = (r: ProductItem) => { setEditing(r); form.setFieldsValue(r); setFormOpen(true); };

  const handleSave = async () => {
    const vals = await form.validateFields();
    if (editing) {
      await apiProductUpdate(editing.id, vals);
      message.success('已更新');
    } else {
      await apiProductCreate(vals);
      message.success('已创建');
    }
    setFormOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    await apiProductDelete(id);
    message.success('已删除');
    load();
  };

  const openStock = (r: ProductItem) => {
    setStockTarget(r);
    stockForm.resetFields();
    stockForm.setFieldsValue({ type: 'IN', quantity: 1 });
    setStockOpen(true);
  };

  const handleStock = async () => {
    const vals = await stockForm.validateFields();
    await apiStockChange(stockTarget!.id, vals);
    message.success('库存已更新');
    setStockOpen(false);
    load();
  };

  const openMovements = async (r: ProductItem) => {
    setMvTarget(r);
    setMvOpen(true);
    const rows = await apiStockMovements(r.id);
    setMovements(rows);
  };

  const columns: ColumnsType<ProductItem> = [
    { title: '编码', dataIndex: 'code', width: 100 },
    { title: '名称', dataIndex: 'name', width: 140 },
    { title: '分类', dataIndex: 'category', width: 80 },
    { title: '单价', dataIndex: 'price', width: 80, render: (v) => `¥${v}` },
    { title: '成本', dataIndex: 'cost', width: 80, render: (v) => v != null ? `¥${v}` : '-' },
    {
      title: '库存', dataIndex: 'stock', width: 90,
      render: (v, r) => {
        const warn = r.stock_alert != null && v <= r.stock_alert;
        return <span style={warn ? { color: '#ff4d4f', fontWeight: 600 } : undefined}>{v} {r.unit}{warn && <WarningOutlined style={{ marginLeft: 4 }} />}</span>;
      },
    },
    { title: '预警线', dataIndex: 'stock_alert', width: 70, render: (v) => v ?? '-' },
    {
      title: '状态', dataIndex: 'status', width: 70,
      render: (v) => <Tag color={v === 1 ? 'green' : 'default'}>{v === 1 ? '在售' : '下架'}</Tag>,
    },
    {
      title: '操作', width: 220, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <a onClick={() => openEdit(r)}>编辑</a>
          <a onClick={() => openStock(r)}>库存</a>
          <a onClick={() => openMovements(r)}>流水</a>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <h4>商品与库存</h4>
        <Space wrap>
          <Input.Search placeholder="名称 / 编码" allowClear onSearch={(v) => setKeyword(v)} style={{ width: 220 }} />
          <Select value={warnOnly ? '1' : '0'} onChange={(v) => setWarnOnly(v === '1')} style={{ width: 120 }}>
            <Select.Option value="0">全部商品</Select.Option>
            <Select.Option value="1">库存预警</Select.Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          <Button icon={<DownloadOutlined />} onClick={exportProducts}>导出</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增商品</Button>
        </Space>
      </div>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 960 }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); } }}
        />
      </Card>

      {/* 新增/编辑 */}
      <Modal title={editing ? '编辑商品' : '新增商品'} open={formOpen} onOk={handleSave} onCancel={() => setFormOpen(false)} destroyOnClose width={520}>
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="编码" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Space>
            <Form.Item name="category" label="分类"><Input placeholder="如：营养品/装备/饮品" /></Form.Item>
            <Form.Item name="unit" label="单位"><Input placeholder="件" /></Form.Item>
          </Space>
          <Space>
            <Form.Item name="price" label="售价" rules={[{ required: true }]}><InputNumber min={0} precision={2} /></Form.Item>
            <Form.Item name="cost" label="成本"><InputNumber min={0} precision={2} /></Form.Item>
          </Space>
          <Space>
            <Form.Item name="stock" label="库存"><InputNumber min={0} precision={0} /></Form.Item>
            <Form.Item name="stock_alert" label="预警线"><InputNumber min={0} precision={0} /></Form.Item>
          </Space>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Select.Option value={1}>在售</Select.Option>
              <Select.Option value={0}>下架</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 库存变动 */}
      <Modal title={`库存变动 - ${stockTarget?.name || ''}`} open={stockOpen} onOk={handleStock} onCancel={() => setStockOpen(false)} destroyOnClose width={400}>
        <Form form={stockForm} layout="vertical">
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="IN">入库</Select.Option>
              <Select.Option value="OUT">出库</Select.Option>
              <Select.Option value="ADJUST">盘点(直接设值)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true }]}><InputNumber min={0} precision={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="reason" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* 流水抽屉 */}
      <Drawer title={`库存流水 - ${mvTarget?.name || ''}`} open={mvOpen} onClose={() => setMvOpen(false)} width={420}>
        <Timeline items={movements.map((m) => {
          const st = STOCK_MOVE_TYPE[m.type] || { label: m.type, color: 'default' };
          return {
            color: st.color,
            children: (
              <div>
                <Tag color={st.color}>{st.label}</Tag>
                <span>{m.before_stock} → {m.after_stock} (数量 {m.quantity > 0 ? '+' : ''}{m.quantity})</span>
                <div style={{ fontSize: 12, color: '#999' }}>
                  {m.remark && <span>{m.remark} · </span>}
                  {m.operator?.real_name || m.operator?.username || '系统'} · {dayjs(m.created_at).format('MM-DD HH:mm')}
                </div>
              </div>
            ),
          };
        })} />
      </Drawer>
    </>
  );
}
