import { useEffect, useState, useCallback } from 'react';
import { Badge, Popover, List, Button, Tag, Typography, Space, Empty } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import {
  apiUnreadCount, apiNotificationList, apiMarkRead, apiMarkAllRead,
  NotificationItem,
} from '@/api/notification';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

const TYPE_COLOR: Record<string, string> = {
  SYSTEM: 'blue',
  EXPIRE: 'orange',
  BOOKING: 'green',
  STOCK: 'red',
};

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async () => {
    try { const r = await apiUnreadCount(); setCount(r.count); } catch { /* silent */ }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiNotificationList({ pageSize: 20 });
      setList(r.list);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadCount();
    const timer = setInterval(loadCount, 30000);
    return () => clearInterval(timer);
  }, [loadCount]);

  useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  const onMarkRead = async (id: number) => {
    await apiMarkRead([id]);
    setList((prev) => prev.map((n) => n.id === id ? { ...n, is_read: 1 } : n));
    setCount((c) => Math.max(0, c - 1));
  };

  const onMarkAll = async () => {
    await apiMarkAllRead();
    setList((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setCount(0);
  };

  const content = (
    <div style={{ width: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 8px' }}>
        <Text strong>通知</Text>
        {count > 0 && (
          <Button type="link" size="small" icon={<CheckOutlined />} onClick={onMarkAll}>全部已读</Button>
        )}
      </div>
      {list.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无通知" />
      ) : (
        <List
          loading={loading}
          dataSource={list}
          size="small"
          style={{ maxHeight: 400, overflowY: 'auto' }}
          renderItem={(item) => (
            <List.Item
              style={{ padding: '8px 4px', opacity: item.is_read ? 0.55 : 1, cursor: 'pointer' }}
              onClick={() => !item.is_read && onMarkRead(item.id)}
            >
              <List.Item.Meta
                title={
                  <Space size={4}>
                    <Tag color={TYPE_COLOR[item.type] || 'default'} style={{ fontSize: 11 }}>{item.type}</Tag>
                    <span style={{ fontSize: 13 }}>{item.title}</span>
                  </Space>
                }
                description={
                  <div style={{ fontSize: 12 }}>
                    {item.content && <div style={{ marginBottom: 2 }}>{item.content}</div>}
                    <Text type="secondary">{dayjs(item.created_at).fromNow()}</Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Popover content={content} trigger="click" open={open} onOpenChange={setOpen} placement="bottomRight">
      <Badge count={count} size="small" offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#64748b' }} />
      </Badge>
    </Popover>
  );
}
