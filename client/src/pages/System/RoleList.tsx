import { useEffect, useMemo, useState } from 'react';
import {
  Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Tag, Tree, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  apiRoleList, apiRoleCreate, apiRoleUpdate, apiRoleDelete, apiPermissionList,
  RoleItem, PermissionItem,
} from '@/api/system';
import Can from '@/components/Can';

export default function RoleListPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoleItem | null>(null);
  const [form] = Form.useForm();
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([apiRoleList(), apiPermissionList()]);
      setRoles(r);
      setPermissions(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const treeData = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {};
    for (const p of permissions) {
      (groups[p.module] ||= []).push(p);
    }
    return Object.entries(groups).map(([module, perms]) => ({
      title: `${module} (${perms.length})`,
      key: `mod-${module}`,
      selectable: false,
      children: perms.map((p) => ({
        title: `${p.name}  · ${p.code}`,
        key: p.id,
      })),
    }));
  }, [permissions]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setCheckedKeys([]);
    setFormOpen(true);
  };

  const openEdit = (row: RoleItem) => {
    setEditing(row);
    form.setFieldsValue({ code: row.code, name: row.name, description: row.description });
    setCheckedKeys(row.permissionIds);
    setFormOpen(true);
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    const body = { ...values, permissionIds: checkedKeys };
    if (editing) {
      await apiRoleUpdate(editing.id, body);
      message.success('已更新');
    } else {
      await apiRoleCreate(body);
      message.success('已创建');
    }
    setFormOpen(false);
    load();
  };

  const onDelete = async (row: RoleItem) => {
    await apiRoleDelete(row.id);
    message.success('已删除');
    load();
  };

  const columns: ColumnsType<RoleItem> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '编码', dataIndex: 'code', width: 140 },
    { title: '名称', dataIndex: 'name', width: 160 },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '权限数',
      dataIndex: 'permissionIds',
      width: 110,
      render: (v: number[]) => <Tag>{v.length}</Tag>,
    },
    {
      title: '操作', width: 200, fixed: 'right',
      render: (_, row) => (
        <Space>
          <Can code="system:role:manage">
            <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(row)}>编辑</Button>
            <Popconfirm title={`确认删除角色 ${row.name}？`} onConfirm={() => onDelete(row)}>
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
        <h4>角色权限</h4>
        <Can code="system:role:manage">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建角色</Button>
        </Can>
      </div>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          dataSource={roles}
          columns={columns}
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editing ? `编辑角色 - ${editing.name}` : '新建角色'}
        open={formOpen}
        onOk={onSubmit}
        onCancel={() => setFormOpen(false)}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="code" label="编码" rules={[{ required: true, min: 2 }]}>
            <Input disabled={!!editing && ['admin', 'member'].includes(editing.code)} />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item label="权限">
            <Tree
              checkable
              selectable={false}
              treeData={treeData as any}
              checkedKeys={checkedKeys}
              onCheck={(keys: any) => {
                const arr = Array.isArray(keys) ? keys : keys.checked;
                setCheckedKeys(arr.filter((k: any) => typeof k === 'number'));
              }}
              defaultExpandAll
              height={320}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
