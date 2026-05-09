import { useEffect, useState } from 'react';
import {
  Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, KeyOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  apiUserList, apiUserCreate, apiUserUpdate, apiUserDelete, apiUserResetPassword,
  apiRoleList,
  SystemUser, RoleItem,
} from '@/api/system';
import Can from '@/components/Can';

export default function UserListPage() {
  const [data, setData] = useState<SystemUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [roleId, setRoleId] = useState<number | undefined>();

  const [roles, setRoles] = useState<RoleItem[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [form] = Form.useForm();

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdTarget, setPwdTarget] = useState<SystemUser | null>(null);
  const [pwdForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiUserList({ page, pageSize, keyword, role_id: roleId });
      setData(res.list);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { apiRoleList().then(setRoles); }, []);
  useEffect(() => { load(); }, [page, pageSize]);

  const onSearch = () => { if (page === 1) load(); else setPage(1); };
  const onReset = () => { setKeyword(''); setRoleId(undefined); setPage(1); };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 1 });
    setFormOpen(true);
  };

  const openEdit = (row: SystemUser) => {
    setEditing(row);
    form.setFieldsValue({
      username: row.username,
      real_name: row.real_name,
      phone: row.phone,
      role_id: row.role_id,
      status: row.status,
    });
    setFormOpen(true);
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await apiUserUpdate(editing.id, values);
      message.success('已更新');
    } else {
      await apiUserCreate(values);
      message.success('已创建');
    }
    setFormOpen(false);
    load();
  };

  const onDelete = async (row: SystemUser) => {
    await apiUserDelete(row.id);
    message.success('已删除');
    load();
  };

  const openResetPwd = (row: SystemUser) => {
    setPwdTarget(row);
    pwdForm.resetFields();
    setPwdOpen(true);
  };

  const onResetPwd = async () => {
    const { password } = await pwdForm.validateFields();
    await apiUserResetPassword(pwdTarget!.id, password);
    message.success('密码已重置');
    setPwdOpen(false);
  };

  const columns: ColumnsType<SystemUser> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '姓名', dataIndex: 'real_name', width: 120 },
    { title: '手机', dataIndex: 'phone', width: 140 },
    {
      title: '角色', dataIndex: 'role_name', width: 120,
      render: (v, row) => <Tag color={row.role_code === 'admin' ? 'red' : row.role_code === 'staff' ? 'blue' : row.role_code === 'coach' ? 'green' : 'default'}>{v}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v) => v === 1 ? <Tag color="success">启用</Tag> : <Tag color="default">停用</Tag>,
    },
    {
      title: '最近登录', dataIndex: 'last_login_at', width: 170,
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      fixed: 'right',
      width: 240,
      render: (_, row) => (
        <Space>
          <Can code="system:user:update">
            <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(row)}>编辑</Button>
          </Can>
          <Can code="system:user:reset">
            <Button type="link" icon={<KeyOutlined />} onClick={() => openResetPwd(row)}>重置密码</Button>
          </Can>
          <Can code="system:user:delete">
            <Popconfirm title={`确认删除用户 ${row.username}？`} onConfirm={() => onDelete(row)}>
              <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Can>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <h4>用户管理</h4>
        <Space wrap>
          <Input.Search
            placeholder="用户名 / 姓名 / 手机"
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={onSearch}
            style={{ width: 240 }}
          />
          <Select
            allowClear
            placeholder="角色"
            style={{ width: 140 }}
            value={roleId}
            onChange={(v) => setRoleId(v)}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
          />
          <Button icon={<ReloadOutlined />} onClick={onReset}>重置</Button>
          <Button type="primary" icon={<ReloadOutlined />} onClick={onSearch}>查询</Button>
          <Can code="system:user:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建用户</Button>
          </Can>
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
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal
        title={editing ? '编辑用户' : '新建用户'}
        open={formOpen}
        onOk={onSubmit}
        onCancel={() => setFormOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, min: 2 }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          {!editing && (
            <Form.Item name="password" label="初始密码" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="real_name" label="姓名"><Input /></Form.Item>
          <Form.Item name="phone" label="手机"><Input /></Form.Item>
          <Form.Item name="role_id" label="角色" rules={[{ required: true }]}>
            <Select options={roles.map((r) => ({ value: r.id, label: r.name }))} />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked" getValueProps={(v) => ({ checked: v === 1 })} getValueFromEvent={(v) => v ? 1 : 0}>
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`重置密码 - ${pwdTarget?.username}`}
        open={pwdOpen}
        onOk={onResetPwd}
        onCancel={() => setPwdOpen(false)}
        destroyOnClose
      >
        <Form form={pwdForm} layout="vertical" preserve={false}>
          <Form.Item name="password" label="新密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
