import {
  Button, Descriptions, Drawer, Form, Popconfirm, Progress, Select, Space, Spin,
  Table, Tag, Typography, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import {
  apiScheduleGet, apiScheduleCancel, apiScheduleDelete,
  apiBookingCreate, apiBookingCancel, apiBookingCheckIn, apiBookingNoShow,
  apiBookingSelfBook, apiBookingSelfCancel,
  Schedule, Booking,
} from '@/api/course';
import { apiMemberList, Member } from '@/api/member';
import { courseTypeLabel, SCHEDULE_STATUS, BOOKING_STATUS } from '@/config/dicts';
import Can from '@/components/Can';
import { useAuthStore } from '@/stores/authStore';
import ScheduleForm from './ScheduleForm';

const { Text } = Typography;

interface Props {
  open: boolean;
  scheduleId: number | null;
  onClose: () => void;
  onChanged?: () => void;
}

export default function ScheduleDrawer({ open, scheduleId, onClose, onChanged }: Props) {
  const [data, setData] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [memberOptions, setMemberOptions] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canSearchMember = hasPermission('member:view');

  const load = async () => {
    if (!scheduleId) return;
    setLoading(true);
    try { setData(await apiScheduleGet(scheduleId)); } finally { setLoading(false); }
  };
  useEffect(() => { if (open) load(); }, [open, scheduleId]);

  const onSearchMember = async (kw: string) => {
    if (!kw) return;
    setSearching(true);
    try {
      const r = await apiMemberList({ keyword: kw, pageSize: 20 });
      setMemberOptions(r.list);
    } finally { setSearching(false); }
  };

  const onBook = async () => {
    if (!selectedMember || !data) return;
    await apiBookingCreate({ schedule_id: data.id, member_id: selectedMember });
    message.success('预约成功');
    setSelectedMember(null);
    load(); onChanged?.();
  };
  const onSelfBook = async () => {
    if (!data) return;
    await apiBookingSelfBook({ schedule_id: data.id });
    message.success('预约成功');
    load(); onChanged?.();
  };
  const onSelfCancel = async (b: Booking) => {
    await apiBookingSelfCancel(b.id);
    message.success('已取消预约');
    load(); onChanged?.();
  };
  const onCancel = async (b: Booking) => { await apiBookingCancel(b.id); message.success('已取消'); load(); onChanged?.(); };
  const onCheckIn = async (b: Booking) => {
    const res: any = await apiBookingCheckIn(b.id);
    message.success(res?.deducted?.card_no ? `已签到，扣次卡 ${res.deducted.card_no}` : '已签到');
    load(); onChanged?.();
  };
  const onNoShow = async (b: Booking) => { await apiBookingNoShow(b.id); message.success('已标记未到'); load(); onChanged?.(); };
  const onScheduleCancel = async () => {
    const res: any = await apiScheduleCancel(data!.id);
    message.success(typeof res === 'string' ? res : '排期已取消');
    onClose(); onChanged?.();
  };
  const onScheduleDelete = async () => { await apiScheduleDelete(data!.id); message.success('已删除'); onClose(); onChanged?.(); };
  const onEditOk = () => { setEditOpen(false); load(); onChanged?.(); };

  const columns: ColumnsType<Booking> = [
    {
      title: '会员', width: 220,
      render: (_, r) => (
        <div>
          <div>{r.member?.name} <Text type="secondary">({r.member?.member_no})</Text></div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.member?.phone || '-'}</Text>
        </div>
      ),
    },
    { title: '状态', dataIndex: 'status', width: 110, render: (v: string) => <Tag color={BOOKING_STATUS[v]?.color}>{BOOKING_STATUS[v]?.label}</Tag> },
    { title: '签到时间', dataIndex: 'checked_in_at', width: 150, render: (v) => v ? dayjs(v).format('MM-DD HH:mm:ss') : '-' },
    {
      title: '操作', width: 230, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          {r.status === 'BOOKED' && (
            <>
              <Can code="checkin:manage">
                <Popconfirm title="确认签到？" onConfirm={() => onCheckIn(r)}>
                  <Button type="link" size="small" icon={<CheckOutlined />}>签到</Button>
                </Popconfirm>
              </Can>
              <Can code="booking:manage">
                {canSearchMember ? (
                  <Popconfirm title="取消此预约？" onConfirm={() => onCancel(r)}>
                    <Button type="link" size="small" icon={<CloseOutlined />}>取消</Button>
                  </Popconfirm>
                ) : (
                  <Popconfirm title="取消您的预约？" onConfirm={() => onSelfCancel(r)}>
                    <Button type="link" size="small" icon={<CloseOutlined />}>取消</Button>
                  </Popconfirm>
                )}
              </Can>
              <Can code="checkin:manage">
                <Popconfirm title="标记该会员未到？" onConfirm={() => onNoShow(r)}>
                  <Button type="link" size="small" danger>未到</Button>
                </Popconfirm>
              </Can>
            </>
          )}
        </Space>
      ),
    },
  ];

  const started = data && dayjs(data.start_time).isBefore(dayjs());
  const cap = data?.capacity || 0;
  const booked = data?.booked_count || 0;
  const percent = cap > 0 ? Math.round((booked / cap) * 100) : 0;

  return (
    <Drawer
      title={data ? `排期 - ${data.course?.name}` : '排期详情'}
      open={open} onClose={onClose}
      width={Math.min(900, window.innerWidth - 100)}
      destroyOnClose
      extra={
        data && (
          <Can code="course:manage">
            <Space>
              {data.status === 'OPEN' && !started && (
                <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑</Button>
              )}
              {data.status === 'OPEN' && (
                <Popconfirm title="取消后已预约会员将被通知，确认？" onConfirm={onScheduleCancel}>
                  <Button danger>取消排期</Button>
                </Popconfirm>
              )}
              {data.bookings?.length === 0 && (
                <Popconfirm title="删除此排期？" onConfirm={onScheduleDelete}>
                  <Button danger>删除</Button>
                </Popconfirm>
              )}
            </Space>
          </Can>
        )
      }
    >
      {loading && !data ? <Spin /> : data && (
        <>
          <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="课程">{data.course?.name} ({courseTypeLabel(data.course?.type)})</Descriptions.Item>
            <Descriptions.Item label="教练">{data.coach?.name}</Descriptions.Item>
            <Descriptions.Item label="开始" span={1}>{dayjs(data.start_time).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="结束" span={1}>{dayjs(data.end_time).format('HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="场地">{data.location || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={SCHEDULE_STATUS[data.status]?.color}>{SCHEDULE_STATUS[data.status]?.label}</Tag>
              {started && <Tag>已开始</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="容量" span={2}>
              <Progress percent={percent} format={() => `${booked} / ${cap}`} />
            </Descriptions.Item>
          </Descriptions>

          <Can code="booking:manage">
            {data.status === 'OPEN' && !started && (booked < cap) && (
              canSearchMember ? (
                <Space style={{ marginBottom: 12 }}>
                  <Select
                    showSearch placeholder="搜索会员姓名/手机/编号" style={{ width: 300 }}
                    filterOption={false} onSearch={onSearchMember}
                    value={selectedMember || undefined}
                    onChange={(v) => setSelectedMember(v)}
                    notFoundContent={searching ? <Spin size="small" /> : '输入关键字搜索'}
                    options={memberOptions.map((m) => ({ value: m.id, label: `${m.name} · ${m.phone || '无'} · ${m.member_no}` }))}
                  />
                  <Button type="primary" icon={<PlusOutlined />} disabled={!selectedMember} onClick={onBook}>添加预约</Button>
                </Space>
              ) : (
                <Space style={{ marginBottom: 12 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={onSelfBook}>我要预约</Button>
                </Space>
              )
            )}
          </Can>

          <Table rowKey="id" dataSource={(data.bookings || []).filter((b) => b.status !== 'CANCELLED')} columns={columns} pagination={false} size="small" />
          <ScheduleForm open={editOpen} editData={data} onClose={() => setEditOpen(false)} onOk={onEditOk} />
        </>
      )}
    </Drawer>
  );
}
