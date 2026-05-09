import { useEffect, useState } from 'react';
import {
  Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space,
  Switch, Table, Tag, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  apiPlanList, apiPlanCreate, apiPlanUpdate, apiPlanDelete, MembershipPlan,
} from '@/api/member';
import { PLAN_TYPE_OPTIONS, planTypeLabel } from '@/config/dicts';
import Can from '@/components/Can';

export default function MembershipsPage() {
  const [data, setData] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [form] = Form.useForm();
  const type = Form.useWatch('type', form);

  const load = async () => {
    setLoading(true);
    try { setData(await apiPlanList()); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ type: 'PERIOD', status: 1 });
    setFormOpen(true);
  };

  const openEdit = (row: MembershipPlan) => {
    setEditing(row);
    form.setFieldsValue(row);
    setFormOpen(true);
  };

  const onSubmit = async () => {
    const v = await form.validateFields();
    const body = {
      ...v,
      duration_days: v.type === 'PERIOD' ? v.duration_days : null,
      total_count: v.type === 'COUNT' ? v.total_count : null,
      initial_balance: v.type === 'STORED' ? v.initial_balance : null,
    };
    if (editing) { await apiPlanUpdate(editing.id, body); message.success('已更新'); }
    else { await apiPlanCreate(body); message.success('已创建'); }
    setFormOpen(false); load();
  };

  const columns: ColumnsType<MembershipPlan> = [
    { title: '编码', dataIndex: 'code', width: 120 },
    { title: '名称', dataIndex: 'name', width: 150 },
    { title: '类型', dataIndex: 'type', width: 100, render: (v) => <Tag color="blue">{planTypeLabel(v)}</Tag> },
    { title: '价格', dataIndex: 'price', width: 100, render: (v) => `¥${Number(v).toFixed(2)}` },
    {
      title: '规格', width: 150,
      render: (_, r) => {
        if (r.type === 'PERIOD') return `${r.duration_days} 天`;
        if (r.type === 'COUNT') return `${r.total_count} 次`;
        if (r.type === 'STORED') return `¥${Number(r.initial_balance || 0).toFixed(2)}`;
        return '-';
      },
    },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '状态', dataIndex: 'status', width: 90, render: (v) => v === 1 ? <Tag color="success">启用</Tag> : <Tag>停用</Tag> },
    {
      title: '操作', fixed: 'right', width: 170,
      render: (_, r) => (
        <Can code="membership:manage">
          <Space>
            <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
            <Popconfirm title={`删除卡种 ${r.name}？`} onConfirm={async () => { await apiPlanDelete(r.id); message.success('已删除'); load(); }}>
              <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Space>
        </Can>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <h4>会籍与卡种</h4>
        <Can code="membership:manage">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建卡种</Button>
        </Can>
      </div>

      <Card styles={{ body: { padding: 0 } }}>
        <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={false} scroll={{ x: 1000 }} />
      </Card>

      <Modal
        title={editing ? `编辑卡种 - ${editing.name}` : '新建卡种'}
        open={formOpen}
        onOk={onSubmit}
        onCancel={() => setFormOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="code" label="编码" rules={[{ required: true, min: 2 }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={PLAN_TYPE_OPTIONS} disabled={!!editing} />
          </Form.Item>
          <Form.Item name="price" label="售价" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} prefix="¥" />
          </Form.Item>
          {type === 'PERIOD' && (
            <Form.Item name="duration_days" label="有效期(天)" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          )}
          {type === 'COUNT' && (
            <Form.Item name="total_count" label="总次数" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          )}
          {type === 'STORED' && (
            <Form.Item name="initial_balance" label="初始金额" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} prefix="¥" />
            </Form.Item>
          )}
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item
            name="status" label="状态" valuePropName="checked"
            getValueProps={(v) => ({ checked: v === 1 })}
            getValueFromEvent={(v) => (v ? 1 : 0)}
          >
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
