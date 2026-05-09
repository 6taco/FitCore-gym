import { Button, Typography } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', padding: 24,
    }}>
      <div style={{ fontSize: 120, fontWeight: 800, lineHeight: 1, color: '#e2e8f0', letterSpacing: -4 }}>404</div>
      <Title level={4} style={{ color: '#475569', margin: '12px 0 8px' }}>页面未找到</Title>
      <Paragraph style={{ color: '#94a3b8', maxWidth: 360 }}>
        您访问的页面不存在或已被移除，请检查地址是否正确。
      </Paragraph>
      <Button
        type="primary"
        icon={<HomeOutlined />}
        size="large"
        style={{ marginTop: 16, borderRadius: 10 }}
        onClick={() => navigate('/', { replace: true })}
      >
        返回首页
      </Button>
    </div>
  );
}
