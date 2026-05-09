import { useEffect, useState } from 'react';
import { Card, Table, DatePicker, Space, Tag, Progress, Avatar } from 'antd';
import { TrophyOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { apiCoachRanking, CoachRankItem } from '@/api/course';

const { RangePicker } = DatePicker;

export default function CoachRanking() {
  const [data, setData] = useState<CoachRankItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiCoachRanking({
        start: range[0].format('YYYY-MM-DD'),
        end: range[1].format('YYYY-MM-DD'),
      });
      setData(res);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [range]);

  const medalColor = (idx: number) => {
    if (idx === 0) return '#faad14';
    if (idx === 1) return '#bfbfbf';
    if (idx === 2) return '#d48806';
    return undefined;
  };

  const columns: ColumnsType<CoachRankItem> = [
    {
      title: '排名', width: 70, align: 'center',
      render: (_, __, idx) => {
        const color = medalColor(idx);
        return color
          ? <TrophyOutlined style={{ fontSize: 20, color }} />
          : <span style={{ color: '#999' }}>{idx + 1}</span>;
      },
    },
    {
      title: '教练', width: 160,
      render: (_, r) => (
        <Space>
          <Avatar size={32} icon={<UserOutlined />} src={r.avatar} />
          <div>
            <div style={{ fontWeight: 500 }}>{r.coach_name}</div>
            {r.specialty && <div style={{ fontSize: 11, color: '#999' }}>{r.specialty}</div>}
          </div>
        </Space>
      ),
    },
    { title: '排课数', dataIndex: 'total_schedules', width: 90, align: 'center' },
    { title: '预约数', dataIndex: 'total_bookings', width: 90, align: 'center' },
    {
      title: '签到数', dataIndex: 'total_checked_in', width: 90, align: 'center',
      render: (v) => <Tag color="green">{v}</Tag>,
    },
    {
      title: '出勤率', dataIndex: 'attendance_rate', width: 120,
      render: (v) => <Progress percent={v} size="small" status={v >= 80 ? 'success' : v >= 50 ? 'normal' : 'exception'} />,
    },
  ];

  return (
    <>
      <div className="page-header">
        <h4>教练绩效排行</h4>
        <Space>
          <RangePicker
            value={range}
            onChange={(v) => v && setRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
            allowClear={false}
          />
        </Space>
      </div>
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="coach_id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>
    </>
  );
}
