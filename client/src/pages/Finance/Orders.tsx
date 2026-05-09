import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Space, Input, Select, Tag, DatePicker, Drawer, Descriptions,
  message, Popconfirm, Divider, Card,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  apiOrderList, apiOrderDetail, apiOrderRefund,
  OrderListItem, OrderDetail,
} from '@/api/finance';
import { ORDER_STATUS, paymentMethodLabel } from '@/config/dicts';
import { useAuthStore } from '@/stores/authStore';

const { RangePicker } = DatePicker;

export default function Orders() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [data, setData] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiOrderList({
        page,
        pageSize: 20,
        keyword: keyword || undefined,
        status: status || undefined,
        start: dateRange?.[0],
        end: dateRange?.[1],
      });
      setData(res.list);
      setTotal(res.total);
    } finally { setLoading(false); }
  }, [page, keyword, status, dateRange]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: number) => {
    const d = await apiOrderDetail(id);
    setDetail(d);
    setDrawerOpen(true);
  };

  const handleRefund = async (id: number) => {
    await apiOrderRefund(id);
    message.success('退款成功');
    load();
    if (detail?.id === id) {
      const d = await apiOrderDetail(id);
      setDetail(d);
    }
  };

  const columns: ColumnsType<OrderListItem> = [
    { title: '订单号', dataIndex: 'order_no', width: 160 },
    {
      title: '会员', width: 120,
      render: (_, r) => r.member ? `${r.member.name} (${r.member.member_no})` : '-',
    },
    { title: '金额', dataIndex: 'total_amount', width: 90, render: (v) => `¥${Number(v).toFixed(2)}` },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v) => {
        const s = ORDER_STATUS[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    {
      title: '操作员', width: 100,
      render: (_, r) => r.operator?.real_name || r.operator?.username || '-',
    },
    { title: '时间', dataIndex: 'created_at', width: 160, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', width: 140, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <a onClick={() => openDetail(r.id)}>详情</a>
          {r.status === 'PAID' && hasPermission('order:manage') && (
            <Popconfirm title="确定退款？此操作不可撤销" onConfirm={() => handleRefund(r.id)}>
              <a style={{ color: '#ff4d4f' }}>退款</a>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <h4>订单管理</h4>
        <Space wrap>
          <Input.Search placeholder="订单号" allowClear onSearch={setKeyword} style={{ width: 200 }} />
          <Select value={status} onChange={setStatus} style={{ width: 120 }} allowClear placeholder="状态">
            <Select.Option value="">全部</Select.Option>
            {Object.entries(ORDER_STATUS).map(([k, v]) => (
              <Select.Option key={k} value={k}>{v.label}</Select.Option>
            ))}
          </Select>
          <RangePicker onChange={(_, ds) => setDateRange(ds[0] ? [ds[0], ds[1]] : null)} />
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
        </Space>
      </div>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 860 }}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      {/* 详情抽屉 */}
      <Drawer title={`订单详情 - ${detail?.order_no || ''}`} open={drawerOpen} onClose={() => setDrawerOpen(false)} width={520}>
        {detail && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="订单号">{detail.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={ORDER_STATUS[detail.status]?.color}>{ORDER_STATUS[detail.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="会员">{detail.member ? `${detail.member.name} (${detail.member.member_no})` : '-'}</Descriptions.Item>
              <Descriptions.Item label="操作员">{detail.operator?.real_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="总额">¥{Number(detail.total_amount).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="实付">¥{Number(detail.paid_amount).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="时间" span={2}>{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              {detail.remark && <Descriptions.Item label="备注" span={2}>{detail.remark}</Descriptions.Item>}
            </Descriptions>

            <Divider orientation="left">明细</Divider>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={detail.items}
              columns={[
                { title: '类型', dataIndex: 'item_type', width: 70, render: (v: string) => ({ PRODUCT: '商品', MEMBERSHIP: '会籍', PERSONAL: '私教' } as Record<string, string>)[v] || v },
                { title: '名称', dataIndex: 'item_name' },
                { title: '单价', dataIndex: 'unit_price', width: 80, render: (v) => `¥${v}` },
                { title: '数量', dataIndex: 'quantity', width: 60 },
                { title: '小计', dataIndex: 'subtotal', width: 80, render: (v) => `¥${v}` },
              ]}
            />

            <Divider orientation="left">支付</Divider>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={detail.payments}
              columns={[
                { title: '方式', dataIndex: 'method', width: 90, render: paymentMethodLabel },
                { title: '金额', dataIndex: 'amount', width: 100, render: (v) => `¥${v}` },
                { title: '状态', dataIndex: 'status', width: 80, render: (v) => <Tag color={v === 'SUCCESS' ? 'green' : 'red'}>{v === 'SUCCESS' ? '成功' : '已退款'}</Tag> },
              ]}
            />

            {detail.status === 'PAID' && hasPermission('order:manage') && (
              <>
                <Divider />
                <Popconfirm title="确定退款？" onConfirm={() => handleRefund(detail.id)}>
                  <Button danger block>退款</Button>
                </Popconfirm>
              </>
            )}
          </>
        )}
      </Drawer>
    </>
  );
}
