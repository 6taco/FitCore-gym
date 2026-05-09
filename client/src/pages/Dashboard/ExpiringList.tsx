import { Card, Empty, List, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { apiExpiring, MembershipCard } from '@/api/member';

const { Text } = Typography;

export default function ExpiringList() {
  const [data, setData] = useState<MembershipCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiExpiring(7).then(setData).finally(() => setLoading(false));
  }, []);

  return (
    <Card title="7 日内即将过期的会员卡" size="small" loading={loading}>
      {data.length === 0 ? <Empty description="暂无" /> : (
        <List
          size="small"
          dataSource={data}
          renderItem={(c) => {
            const days = c.end_date ? dayjs(c.end_date).diff(dayjs().startOf('day'), 'day') : null;
            return (
              <List.Item>
                <Text>{c.member?.name}</Text>
                <Text type="secondary" style={{ margin: '0 8px' }}>{c.plan?.name}</Text>
                <Text type="secondary">到期 {c.end_date}</Text>
                <Tag color={days !== null && days <= 3 ? 'red' : 'orange'} style={{ marginLeft: 'auto' }}>
                  {days !== null ? (days >= 0 ? `${days} 天后` : '已过期') : '-'}
                </Tag>
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
}
