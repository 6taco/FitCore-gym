import { useEffect, useState } from 'react';
import {
  Avatar, Button, Card, DatePicker, Descriptions, Drawer, Form, Input, InputNumber,
  Modal, Popconfirm, Radio, Space, Statistic, Switch, Table, Tag, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, BarChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  apiCoachList, apiCoachCreate, apiCoachUpdate, apiCoachDelete, apiCoachStats,
  Coach, CoachStats,
} from '@/api/course';
import { GENDER_OPTIONS, genderLabel } from '@/config/dicts';
import Can from '@/components/Can';

export default function CoachesPage() {
  const [data, setData] = useState<Coach[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coach | null>(null);
  const [form] = Form.useForm();

  const [statsOpen, setStatsOpen] = useState(false);
  const [statsCoach, setStatsCoach] = useState<Coach | null>(null);
  const [stats, setStats] = useState<CoachStats | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiCoachList({ page, pageSize, keyword });
      setData(res.list); setTotal(res.total);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [page, pageSize]);

  const openCreate = () => {
    setEditing(null); form.resetFields();
    form.setFieldsValue({ gender: 0, status: 1 });
    setFormOpen(true);
  };
  const openEdit = (r: Coach) => {
    setEditing(r);
    form.setFieldsValue({ ...r, hire_date: r.hire_date ? dayjs(r.hire_date) : undefined });
    setFormOpen(true);
  };
  const onSubmit = async () => {
    const v = await form.validateFields();
    const body = { ...v, hire_date: v.hire_date ? dayjs(v.hire_date).format('YYYY-MM-DD') : null };
    if (editing) { await apiCoachUpdate(editing.id, body); message.success('已更新'); }
    else { await apiCoachCreate(body); message.success('已创建'); }
    setFormOpen(false); load();
  };

  const openStats = async (r: Coach) => {
    setStatsCoach(r); setStatsOpen(true);
    setStats(null);
    const s = await apiCoachStats(r.id);
    setStats(s);
  };

  const columns: ColumnsType<Coach> = [
    {
      title: '教练', width: 200, fixed: 'left',
      render: (_, r) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={r.avatar} />
          <div>
            <div style={{ fontWeight: 500 }}>{r.name}</div>
            <div style={{ color: '#888', fontSize: 12 }}>{genderLabel(r.gender)} · {r.phone || '无手机'}</div>
          </div>
        </Space>
      ),
    },
    { title: '擅长', dataIndex: 'specialty', ellipsis: true },
    { title: '入职', dataIndex: 'hire_date', width: 120 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v) => v === 1 ? <Tag color="success">在职</Tag> : <Tag>离职</Tag> },
    {
      title: '操作', fixed: 'right', width: 240,
      render: (_, r) => (
        <Space>
          <Can code="member:view">
            <Button type="link" icon={<BarChartOutlined />} onClick={() => openStats(r)}>业绩</Button>
          </Can>
          <Can code="course:manage">
            <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
            <Popconfirm title={`删除教练 ${r.name}？`} onConfirm={async () => { await apiCoachDelete(r.id); message.success('已删除'); load(); }}>
              <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Can>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="教练管理"
      extra={
        <Space>
          <Input.Search placeholder="姓名/手机/擅长" value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => (page === 1 ? load() : setPage(1))} allowClear style={{ width: 220 }} />
          <Can code="course:manage">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建教练</Button>
          </Can>
        </Space>
      }
    >
      <Table rowKey="id" dataSource={data} columns={columns} loading={loading} scroll={{ x: 900 }}
        pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `共 ${t} 条`, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }}
      />

      <Modal title={editing ? `编辑教练 - ${editing.name}` : '新建教练'}
        open={formOpen} onOk={onSubmit} onCancel={() => setFormOpen(false)} destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="gender" label="性别"><Radio.Group options={GENDER_OPTIONS} optionType="button" /></Form.Item>
          <Form.Item name="phone" label="手机"><Input /></Form.Item>
          <Form.Item name="specialty" label="擅长项目"><Input placeholder="多个用逗号分隔" /></Form.Item>
          <Form.Item name="intro" label="简介"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="hire_date" label="入职日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked"
            getValueProps={(v) => ({ checked: v === 1 })} getValueFromEvent={(v) => v ? 1 : 0}
          >
            <Switch checkedChildren="在职" unCheckedChildren="离职" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title={`业绩统计 - ${statsCoach?.name}`} open={statsOpen} onClose={() => setStatsOpen(false)} width={480}>
        {stats ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Statistic title="累计排期节数" value={stats.total_schedules} />
            <Statistic title="累计预约人次" value={stats.total_bookings} />
            <Statistic title="累计签到人次" value={stats.total_checked_in} />
          </Space>
        ) : '加载中...'}
      </Drawer>
    </Card>
  );
}
