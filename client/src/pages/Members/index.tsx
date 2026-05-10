import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Avatar, Button, Card, Input, Popconfirm, Select, Space, Table, Tag, message, Upload, Modal,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, UserOutlined, DeleteOutlined, EditOutlined, EyeOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiMemberList, apiMemberDelete, Member } from '@/api/member';
import { genderLabel } from '@/config/dicts';
import Can from '@/components/Can';
import { exportMembers, importMembers } from '@/api/export';
import MemberForm from './MemberForm';
import MemberDrawer from './MemberDrawer';

export default function MembersPage() {
  const [data, setData] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<number | undefined>();

  const debouncedKeyword = useDebounce(keyword, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  const [drawerId, setDrawerId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiMemberList({ page, pageSize, keyword, status });
      setData(res.list);
      setTotal(res.total);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [page, pageSize, debouncedKeyword]);

  const onSearch = () => (page === 1 ? load() : setPage(1));
  const onReset = () => { setKeyword(''); setStatus(undefined); setPage(1); };

  const columns: ColumnsType<Member> = [
    {
      title: '会员', width: 220, fixed: 'left',
      render: (_, r) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={r.avatar} />
          <div>
            <div style={{ fontWeight: 500 }}>{r.name}</div>
            <div style={{ color: '#888', fontSize: 12 }}>{r.member_no}</div>
          </div>
        </Space>
      ),
    },
    { title: '性别', dataIndex: 'gender', width: 70, render: (v) => genderLabel(v) },
    { title: '手机', dataIndex: 'phone', width: 130 },
    {
      title: '标签', dataIndex: 'tags', width: 180,
      render: (v?: string) => (v ? v.split(',').filter(Boolean).map((t) => <Tag key={t}>{t}</Tag>) : '-'),
    },
    {
      title: '有效卡', dataIndex: 'active_memberships', width: 90,
      render: (v) => <Tag color={v > 0 ? 'green' : 'default'}>{v || 0}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v) => v === 1 ? <Tag color="success">正常</Tag> : <Tag>停用</Tag>,
    },
    { title: '加入时间', dataIndex: 'created_at', width: 160, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', fixed: 'right', width: 220,
      render: (_, r) => (
        <Space size={4}>
          <Button type="link" icon={<EyeOutlined />} onClick={() => setDrawerId(r.id)}>详情</Button>
          <Can code="member:update">
            <Button type="link" icon={<EditOutlined />} onClick={() => { setEditing(r); setFormOpen(true); }}>编辑</Button>
          </Can>
          <Can code="member:delete">
            <Popconfirm title={`删除会员 ${r.name}？`} onConfirm={async () => { await apiMemberDelete(r.id); message.success('已删除'); load(); }}>
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
        <h4>会员管理</h4>
        <Space wrap>
          <Input.Search
            placeholder="姓名 / 手机 / 编号"
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={onSearch}
            style={{ width: 220 }}
          />
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 110 }}
            value={status}
            onChange={setStatus}
            options={[{ value: 1, label: '正常' }, { value: 0, label: '停用' }]}
          />
          <Button icon={<ReloadOutlined />} onClick={onReset}>重置</Button>
          <Button type="primary" icon={<ReloadOutlined />} onClick={onSearch}>查询</Button>
          <Can code="member:view">
            <Button icon={<DownloadOutlined />} onClick={exportMembers}>导出</Button>
          </Can>
          <Can code="member:create">
            <Upload accept=".xlsx,.xls" showUploadList={false} customRequest={async ({ file }) => {
              try {
                const res = await importMembers(file as File);
                Modal.info({ title: '导入结果', content: `成功 ${res.success} 条，跳过 ${res.skipped} 条${res.errors?.length ? '\n' + res.errors.join('\n') : ''}` });
                load();
              } catch { /* interceptor */ }
            }}><Button icon={<UploadOutlined />}>导入</Button></Upload>
          </Can>
          <Can code="member:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setFormOpen(true); }}>新建会员</Button>
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
            current: page, pageSize, total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <MemberForm
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onOk={() => { setFormOpen(false); load(); }}
      />

      <MemberDrawer
        open={drawerId !== null}
        memberId={drawerId}
        onClose={() => { setDrawerId(null); load(); }}
      />
    </>
  );
}
