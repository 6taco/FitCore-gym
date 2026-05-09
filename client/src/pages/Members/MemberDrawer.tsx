import {
  Avatar, Button, Descriptions, Drawer, Empty, Popconfirm, Space,
  Table, Tabs, Tag, Timeline, Typography, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import {
  apiMemberGet, apiMemberMemberships, apiMeasurementList, apiMeasurementDelete,
  apiSuspend, apiResume, apiCancel, apiCheckInList, apiStoredCardHistory,
  Member, MembershipCard, BodyMeasurement, CheckInRecord, StoredHistoryItem,
} from '@/api/member';
import { genderLabel, planTypeLabel, CARD_STATUS } from '@/config/dicts';
import Can from '@/components/Can';
import IssueCardModal from './IssueCardModal';
import RenewModal from './RenewModal';
import TransferModal from './TransferModal';
import BodyMeasurementModal from './BodyMeasurementModal';

const { Text } = Typography;

interface Props {
  open: boolean;
  memberId: number | null;
  onClose: () => void;
}

export default function MemberDrawer({ open, memberId, onClose }: Props) {
  const [member, setMember] = useState<Member | null>(null);
  const [cards, setCards] = useState<MembershipCard[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(false);

  const [issueOpen, setIssueOpen] = useState(false);
  const [renewCard, setRenewCard] = useState<MembershipCard | null>(null);
  const [transferCard, setTransferCard] = useState<MembershipCard | null>(null);
  const [bmOpen, setBmOpen] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [storedHistory, setStoredHistory] = useState<StoredHistoryItem[]>([]);
  const [storedBalance, setStoredBalance] = useState<number | null>(null);

  const load = async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const [m, c, b] = await Promise.all([
        apiMemberGet(memberId),
        apiMemberMemberships(memberId),
        apiMeasurementList(memberId),
      ]);
      setMember(m);
      setCards(c);
      setMeasurements(b);
      // load check-ins
      apiCheckInList({ member_id: memberId, pageSize: 50 }).then((r) => setCheckIns(r.list)).catch(() => {});
      // load stored card history if there's a stored card
      const storedCard = c.find((card) => card.plan?.type === 'STORED' && card.status !== 'CANCELLED');
      if (storedCard) {
        apiStoredCardHistory(storedCard.id, { pageSize: 50 })
          .then((r) => { setStoredHistory(r.list); setStoredBalance(r.balance); })
          .catch(() => {});
      } else {
        setStoredHistory([]);
        setStoredBalance(null);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { if (open && memberId) load(); }, [open, memberId]);

  const onSuspend = async (c: MembershipCard) => { await apiSuspend(c.id); message.success('已挂起'); load(); };
  const onResume = async (c: MembershipCard) => { await apiResume(c.id); message.success('已恢复'); load(); };
  const onCancel = async (c: MembershipCard) => { await apiCancel(c.id); message.success('已作废'); load(); };
  const onDeleteMeasurement = async (id: number) => {
    await apiMeasurementDelete(memberId!, id);
    message.success('已删除');
    load();
  };

  const cardColumns: ColumnsType<MembershipCard> = [
    { title: '卡号', dataIndex: 'card_no', width: 140 },
    { title: '卡种', width: 180, render: (_, r) => `${r.plan?.name} (${planTypeLabel(r.plan?.type)})` },
    { title: '开卡', dataIndex: 'start_date', width: 110 },
    { title: '到期', dataIndex: 'end_date', width: 110, render: (v) => v || '-' },
    {
      title: '剩余',
      width: 110,
      render: (_, r) => {
        if (r.plan?.type === 'COUNT') return `${r.remaining_count ?? 0} 次`;
        if (r.plan?.type === 'STORED') return `¥${Number(r.balance ?? 0).toFixed(2)}`;
        return '-';
      },
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v: string) => <Tag color={CARD_STATUS[v]?.color}>{CARD_STATUS[v]?.label || v}</Tag>,
    },
    {
      title: '操作', width: 260, fixed: 'right',
      render: (_, r) => (
        <Can code="membership:manage">
          <Space size={4} wrap>
            {['ACTIVE', 'SUSPENDED', 'EXPIRED'].includes(r.status) && (
              <Button type="link" size="small" onClick={() => setRenewCard(r)}>续费</Button>
            )}
            {r.status === 'ACTIVE' && (
              <Popconfirm title="确认挂起此卡？" onConfirm={() => onSuspend(r)}>
                <Button type="link" size="small">挂起</Button>
              </Popconfirm>
            )}
            {r.status === 'SUSPENDED' && (
              <Popconfirm title="恢复此卡？" onConfirm={() => onResume(r)}>
                <Button type="link" size="small">恢复</Button>
              </Popconfirm>
            )}
            {['ACTIVE', 'SUSPENDED'].includes(r.status) && (
              <Button type="link" size="small" onClick={() => setTransferCard(r)}>转让</Button>
            )}
            {r.status !== 'CANCELLED' && (
              <Popconfirm title="作废后不可恢复，确认？" onConfirm={() => onCancel(r)}>
                <Button type="link" size="small" danger>作废</Button>
              </Popconfirm>
            )}
          </Space>
        </Can>
      ),
    },
  ];

  return (
    <Drawer
      title={member ? `会员详情 - ${member.name}` : '会员详情'}
      open={open}
      onClose={onClose}
      width={Math.min(960, window.innerWidth - 100)}
      destroyOnClose
    >
      {member && (
        <Tabs
          defaultActiveKey="info"
          items={[
            {
              key: 'info',
              label: '基础资料',
              children: (
                <>
                  <Space style={{ marginBottom: 16 }}>
                    <Avatar size={64} icon={<UserOutlined />} src={member.avatar} />
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 500 }}>{member.name}</div>
                      <Text type="secondary">{member.member_no}</Text>
                    </div>
                  </Space>
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="性别">{genderLabel(member.gender)}</Descriptions.Item>
                    <Descriptions.Item label="手机">{member.phone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="生日">{member.birthday || '-'}</Descriptions.Item>
                    <Descriptions.Item label="证件号">{member.id_card || '-'}</Descriptions.Item>
                    <Descriptions.Item label="身高">{member.height_cm ? `${member.height_cm} cm` : '-'}</Descriptions.Item>
                    <Descriptions.Item label="体重">{member.weight_kg ? `${member.weight_kg} kg` : '-'}</Descriptions.Item>
                    <Descriptions.Item label="状态">{member.status === 1 ? <Tag color="success">正常</Tag> : <Tag>停用</Tag>}</Descriptions.Item>
                    <Descriptions.Item label="标签">
                      {(member.tags || '').split(',').filter(Boolean).map((t) => <Tag key={t}>{t}</Tag>) || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="加入时间" span={2}>{dayjs(member.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                    <Descriptions.Item label="备注" span={2}>{member.remark || '-'}</Descriptions.Item>
                  </Descriptions>
                </>
              ),
            },
            {
              key: 'membership',
              label: `会员卡 (${cards.length})`,
              children: (
                <>
                  <Space style={{ marginBottom: 12 }}>
                    <Can code="membership:manage">
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => setIssueOpen(true)}>办卡</Button>
                    </Can>
                  </Space>
                  <Table
                    rowKey="id"
                    columns={cardColumns}
                    dataSource={cards}
                    loading={loading}
                    pagination={false}
                    scroll={{ x: 1000 }}
                    size="small"
                  />
                </>
              ),
            },
            {
              key: 'measurement',
              label: `体测记录 (${measurements.length})`,
              children: (
                <>
                  <Space style={{ marginBottom: 12 }}>
                    <Can code="member:update">
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => setBmOpen(true)}>新增体测</Button>
                    </Can>
                  </Space>
                  {measurements.length === 0 ? <Empty /> : (
                    <Timeline
                      items={measurements.map((m) => ({
                        color: 'blue',
                        children: (
                          <div>
                            <Text strong>{dayjs(m.measured_at).format('YYYY-MM-DD HH:mm')}</Text>
                            <div style={{ marginTop: 4 }}>
                              <Space wrap>
                                {m.height_cm ? <Tag>身高 {m.height_cm} cm</Tag> : null}
                                {m.weight_kg ? <Tag color="blue">体重 {m.weight_kg} kg</Tag> : null}
                                {m.body_fat ? <Tag color="orange">体脂 {m.body_fat}%</Tag> : null}
                                {m.muscle_kg ? <Tag color="green">肌肉 {m.muscle_kg} kg</Tag> : null}
                                {m.bmi ? <Tag color="purple">BMI {m.bmi}</Tag> : null}
                              </Space>
                            </div>
                            {m.remark && <div style={{ color: '#888', marginTop: 4 }}>{m.remark}</div>}
                            <Can code="member:update">
                              <Popconfirm title="删除该条体测？" onConfirm={() => onDeleteMeasurement(m.id)}>
                                <Button size="small" type="link" danger style={{ paddingLeft: 0 }}>删除</Button>
                              </Popconfirm>
                            </Can>
                          </div>
                        ),
                      }))}
                    />
                  )}
                </>
              ),
            },
            {
              key: 'checkins',
              label: `签到记录 (${checkIns.length})`,
              children: checkIns.length === 0 ? <Empty description="暂无签到记录" /> : (
                <Table
                  rowKey="id" size="small" pagination={false}
                  dataSource={checkIns}
                  columns={[
                    { title: '签到时间', dataIndex: 'check_in_at', width: 170, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
                    { title: '方式', dataIndex: 'method', width: 80, render: (v: string) => <Tag>{v === 'MANUAL' ? '手动' : v === 'CARD' ? '刷卡' : v === 'QR' ? '扫码' : v}</Tag> },
                    { title: '操作人', width: 100, render: (_: any, r: CheckInRecord) => r.operator?.real_name || r.operator?.username || '-' },
                    { title: '备注', dataIndex: 'remark', ellipsis: true },
                  ]}
                />
              ),
            },
            ...(storedBalance !== null ? [{
              key: 'stored',
              label: `储值消费 (余额 ¥${Number(storedBalance).toFixed(2)})`,
              children: storedHistory.length === 0 ? <Empty description="暂无消费记录" /> : (
                <Table
                  rowKey="id" size="small" pagination={false}
                  dataSource={storedHistory}
                  columns={[
                    { title: '订单号', dataIndex: 'order_no', width: 180 },
                    { title: '金额', dataIndex: 'amount', width: 90, render: (v: number) => `¥${Number(v).toFixed(2)}` },
                    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'REFUNDED' ? 'red' : 'green'}>{v}</Tag> },
                    { title: '时间', dataIndex: 'paid_at', width: 160, render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
                    { title: '明细', render: (_: any, r: StoredHistoryItem) => r.items.map((i) => `${i.name}×${i.qty}`).join('、') || '-' },
                  ]}
                />
              ),
            }] : []),
          ]}
        />
      )}

      <IssueCardModal
        open={issueOpen}
        memberId={memberId!}
        onClose={() => setIssueOpen(false)}
        onOk={() => { setIssueOpen(false); load(); }}
      />
      <RenewModal
        open={!!renewCard}
        card={renewCard}
        onClose={() => setRenewCard(null)}
        onOk={() => { setRenewCard(null); load(); }}
      />
      <TransferModal
        open={!!transferCard}
        card={transferCard}
        onClose={() => setTransferCard(null)}
        onOk={() => { setTransferCard(null); load(); }}
      />
      <BodyMeasurementModal
        open={bmOpen}
        memberId={memberId!}
        onClose={() => setBmOpen(false)}
        onOk={() => { setBmOpen(false); load(); }}
      />
    </Drawer>
  );
}
