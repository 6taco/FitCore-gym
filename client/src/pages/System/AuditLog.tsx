import { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Input, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { apiAuditList, AuditLogItem } from '@/api/system';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function AuditLogPage() {
  const [data, setData] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiAuditList({
        page, pageSize, keyword,
        startTime: range?.[0]?.toISOString(),
        endTime: range?.[1]?.toISOString(),
      });
      setData(res.list);
      setTotal(res.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, pageSize]);

  const columns: ColumnsType<AuditLogItem> = [
    { title: '时间', dataIndex: 'created_at', width: 170, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    { title: '操作人', dataIndex: 'username', width: 120 },
    { title: '模块', dataIndex: 'module', width: 120, render: (v) => v ? <Tag color="blue">{v}</Tag> : '-' },
    { title: '动作', dataIndex: 'action', width: 180, render: (v) => <Tag>{v}</Tag> },
    { title: '目标', dataIndex: 'target_id', width: 120 },
    { title: 'IP', dataIndex: 'ip', width: 160 },
    {
      title: '详情', dataIndex: 'detail',
      render: (v) => <Text code style={{ fontSize: 12 }} copyable>{v}</Text>,
    },
  ];

  return (
    <>
      <div className="page-header">
        <h4>操作日志</h4>
        <Space wrap>
          <Input.Search
            placeholder="用户名 / 目标 ID"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => (page === 1 ? load() : setPage(1))}
            allowClear
            style={{ width: 220 }}
          />
          <RangePicker showTime value={range as any} onChange={(v) => setRange(v as any)} />
          <Button icon={<ReloadOutlined />} onClick={() => (page === 1 ? load() : setPage(1))}>刷新</Button>
        </Space>
      </div>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          dataSource={data}
          columns={columns}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>
    </>
  );
}
