import { useEffect, useState } from 'react';
import {
  Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch,
  Table, Tag, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  apiCourseList, apiCourseCreate, apiCourseUpdate, apiCourseDelete, Course,
} from '@/api/course';
import { COURSE_TYPE_OPTIONS, courseTypeLabel } from '@/config/dicts';
import Can from '@/components/Can';

export default function CourseLibraryPage() {
  const [data, setData] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form] = Form.useForm();
  const type = Form.useWatch('type', form);

  const load = async () => {
    setLoading(true);
    try { setData(await apiCourseList()); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null); form.resetFields();
    form.setFieldsValue({ type: 'GROUP', duration_min: 60, status: 1 });
    setFormOpen(true);
  };
  const openEdit = (r: Course) => { setEditing(r); form.setFieldsValue(r); setFormOpen(true); };

  const onSubmit = async () => {
    const v = await form.validateFields();
    const body = {
      ...v,
      capacity: v.type === 'GROUP' ? v.capacity : 1,
      price: v.type === 'PERSONAL' ? v.price : null,
    };
    if (editing) { await apiCourseUpdate(editing.id, body); message.success('已更新'); }
    else { await apiCourseCreate(body); message.success('已创建'); }
    setFormOpen(false); load();
  };

  const columns: ColumnsType<Course> = [
    { title: '编码', dataIndex: 'code', width: 120 },
    { title: '名称', dataIndex: 'name', width: 160 },
    { title: '类型', dataIndex: 'type', width: 100, render: (v) => <Tag color={v === 'GROUP' ? 'blue' : 'purple'}>{courseTypeLabel(v)}</Tag> },
    { title: '时长(分钟)', dataIndex: 'duration_min', width: 110 },
    { title: '容量', dataIndex: 'capacity', width: 80 },
    { title: '私教单价', dataIndex: 'price', width: 110, render: (v) => v ? `¥${Number(v).toFixed(2)}` : '-' },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '状态', dataIndex: 'status', width: 80, render: (v) => v === 1 ? <Tag color="success">启用</Tag> : <Tag>停用</Tag> },
    {
      title: '操作', fixed: 'right', width: 170,
      render: (_, r) => (
        <Can code="course:manage">
          <Space>
            <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
            <Popconfirm title={`删除课程 ${r.name}？`} onConfirm={async () => { await apiCourseDelete(r.id); message.success('已删除'); load(); }}>
              <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Space>
        </Can>
      ),
    },
  ];

  return (
    <Card
      title="课程库"
      extra={<Can code="course:manage"><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建课程</Button></Can>}
    >
      <Table rowKey="id" dataSource={data} columns={columns} loading={loading} pagination={false} scroll={{ x: 1100 }} />

      <Modal title={editing ? `编辑课程 - ${editing.name}` : '新建课程'}
        open={formOpen} onOk={onSubmit} onCancel={() => setFormOpen(false)} destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="code" label="编码" rules={[{ required: true, min: 2 }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={COURSE_TYPE_OPTIONS} disabled={!!editing} />
          </Form.Item>
          <Form.Item name="duration_min" label="时长(分钟)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={10} max={600} />
          </Form.Item>
          {type === 'GROUP' && (
            <Form.Item name="capacity" label="团课容量" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={1} max={200} />
            </Form.Item>
          )}
          {type === 'PERSONAL' && (
            <Form.Item name="price" label="私教单价" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} prefix="¥" />
            </Form.Item>
          )}
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked"
            getValueProps={(v) => ({ checked: v === 1 })} getValueFromEvent={(v) => v ? 1 : 0}
          >
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
