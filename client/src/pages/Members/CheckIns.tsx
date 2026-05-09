import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Card, Table, Button, Space, Select, Spin, DatePicker, Tag, Statistic, message, Modal, Typography,
} from 'antd';
import { LoginOutlined, ReloadOutlined, QrcodeOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  apiCheckIn,
  apiCheckInList,
  apiCheckInToday,
  apiCheckInQrToken,
  apiCheckInQrStatus,
  apiMemberList,
  CheckInRecord,
  Member,
} from '@/api/member';
import Can from '@/components/Can';

const { Text } = Typography;

const { RangePicker } = DatePicker;

export default function CheckIns() {
  const [data, setData] = useState<CheckInRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().startOf('day'), dayjs().endOf('day')]);

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);

  const [qrOpen, setQrOpen] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrCountdown, setQrCountdown] = useState(0);
  const qrTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrStatusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrStatusLockRef = useRef(false);

  const fetchQrToken = useCallback(async () => {
    const res = await apiCheckInQrToken();
    setQrToken(res.token);
    setQrCountdown(60);
    qrStatusLockRef.current = false;
    return res.token;
  }, []);

  useEffect(() => {
    if (!qrOpen) {
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
      if (qrStatusTimerRef.current) clearInterval(qrStatusTimerRef.current);
      return;
    }

    fetchQrToken().catch(() => { /* handled by interceptor */ });

    qrTimerRef.current = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          fetchQrToken().catch(() => { /* handled by interceptor */ });
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
      if (qrStatusTimerRef.current) clearInterval(qrStatusTimerRef.current);
    };
  }, [qrOpen, fetchQrToken]);

  useEffect(() => {
    if (!qrOpen || !qrToken) {
      if (qrStatusTimerRef.current) clearInterval(qrStatusTimerRef.current);
      return;
    }

    qrStatusTimerRef.current = setInterval(async () => {
      if (qrStatusLockRef.current) return;
      try {
        const status = await apiCheckInQrStatus(qrToken);
        if (status.status === 'PENDING') return;

        qrStatusLockRef.current = true;

        if (status.status === 'SUCCESS') {
          message.success(status.member_name ? `${status.member_name} 扫码签到成功` : '扫码签到成功');
          await load();
          await fetchQrToken();
          return;
        }

        if (status.status === 'FAILED') {
          message.error(status.message || '扫码签到失败，请重试');
          await fetchQrToken();
          return;
        }

        message.warning(status.message || '二维码已过期，已自动刷新');
        await fetchQrToken();
      } catch {
        qrStatusLockRef.current = false;
      }
    }, 2000);

    return () => {
      if (qrStatusTimerRef.current) clearInterval(qrStatusTimerRef.current);
    };
  }, [qrOpen, qrToken, fetchQrToken]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, stats] = await Promise.all([
        apiCheckInList({
          page, pageSize,
          start: range[0].format('YYYY-MM-DD'),
          end: range[1].format('YYYY-MM-DD'),
        }),
        apiCheckInToday(),
      ]);
      setData(res.list);
      setTotal(res.total);
      setTodayCount(stats.today);
    } finally { setLoading(false); }
  }, [page, pageSize, range]);

  useEffect(() => { load(); }, [load]);

  const onSearchMember = async (kw: string) => {
    if (!kw) return;
    setSearching(true);
    try {
      const r = await apiMemberList({ keyword: kw, pageSize: 20 });
      setMembers(r.list);
    } finally { setSearching(false); }
  };

  const onCheckIn = async () => {
    if (!selectedMember) return;
    await apiCheckIn({ member_id: selectedMember });
    message.success('签到成功');
    setSelectedMember(null);
    load();
  };

  const columns: ColumnsType<CheckInRecord> = [
    { title: '会员', width: 160, render: (_, r) => `${r.member?.name || '?'} (${r.member?.member_no || ''})` },
    { title: '手机', width: 130, render: (_, r) => r.member?.phone || '-' },
    { title: '签到时间', dataIndex: 'check_in_at', width: 170, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: '方式', dataIndex: 'method', width: 90,
      render: (v) => <Tag>{v === 'MANUAL' ? '手动' : v === 'CARD' ? '刷卡' : v === 'QR' ? '扫码' : v}</Tag>,
    },
    { title: '操作人', width: 100, render: (_, r) => r.operator?.real_name || r.operator?.username || '-' },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
  ];

  return (
    <>
      <div className="page-header">
        <h4>入场签到</h4>
        <Space wrap>
          <Statistic title="今日签到" value={todayCount} suffix="人" style={{ marginRight: 16 }} />
          <Can code="checkin:manage">
            <Select
              showSearch placeholder="搜索会员" style={{ width: 260 }}
              filterOption={false} onSearch={onSearchMember}
              value={selectedMember || undefined}
              onChange={(v) => setSelectedMember(v)}
              notFoundContent={searching ? <Spin size="small" /> : '输入关键字搜索'}
              options={members.map((m) => ({ value: m.id, label: `${m.name} · ${m.phone || ''} · ${m.member_no}` }))}
            />
            <Button type="primary" icon={<LoginOutlined />} disabled={!selectedMember} onClick={onCheckIn}>签到入场</Button>
            <Button icon={<QrcodeOutlined />} onClick={() => setQrOpen(true)}>扫码签到</Button>
          </Can>
          <RangePicker value={range} onChange={(v) => v && setRange(v as [dayjs.Dayjs, dayjs.Dayjs])} allowClear={false} />
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
        </Space>
      </div>
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id" columns={columns} dataSource={data} loading={loading}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); } }}
          size="middle"
        />
      </Card>
      <Modal
        open={qrOpen}
        onCancel={() => setQrOpen(false)}
        footer={null}
        width={400}
        centered
        destroyOnClose
        title="扫码签到"
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {qrToken ? (
            <>
              <div style={{ display: 'inline-block', padding: 16, border: '3px solid #07c160', borderRadius: 12, background: '#fff' }}>
                <QRCodeSVG value={`${window.location.origin}/qr-checkin?token=${encodeURIComponent(qrToken)}`} size={200} />
              </div>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">请会员使用微信扫一扫完成签到</Text>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>二维码将在 {qrCountdown} 秒后自动刷新</Text>
              </div>
            </>
          ) : (
            <Spin size="large" />
          )}
        </div>
      </Modal>
    </>
  );
}
