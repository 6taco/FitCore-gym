import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, Result, Spin, Typography } from 'antd';
import { CheckCircleOutlined, WalletOutlined } from '@ant-design/icons';
import { apiOrderStatus, apiConfirmPayment } from '@/api/finance';

const { Title, Text } = Typography;

export default function MockPay() {
  const { orderId } = useParams<{ orderId: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<{ id: number; order_no: string; status: string; total_amount: number } | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    apiOrderStatus(Number(orderId))
      .then((res) => {
        setOrder(res);
        if (res.status === 'PAID') setPaid(true);
      })
      .catch(() => setError('订单不存在或已失效'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    try {
      await apiConfirmPayment(order.id);
      setPaid(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || '支付失败');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
        <Result status="error" title="支付失败" subTitle={error} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 20,
    }}>
      <Card style={{ width: 400, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {paid ? (
          <Result
            status="success"
            title="支付成功"
            subTitle={
              <div>
                <div>订单号：{order?.order_no}</div>
                <div>金额：¥{Number(order?.total_amount || 0).toFixed(2)}</div>
              </div>
            }
            extra={<Text type="secondary">您可以关闭此页面</Text>}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <WalletOutlined style={{ fontSize: 48, color: '#764ba2', marginBottom: 16 }} />
            <Title level={4} style={{ marginBottom: 8 }}>模拟支付</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
              订单号：{order?.order_no}
            </Text>
            <Title level={2} style={{ color: '#d9534f', margin: '0 0 32px' }}>
              ¥{Number(order?.total_amount || 0).toFixed(2)}
            </Title>

            {error && <Text type="danger" style={{ display: 'block', marginBottom: 16 }}>{error}</Text>}

            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              loading={paying}
              onClick={handlePay}
              style={{
                width: '100%', height: 50, borderRadius: 10, fontSize: 16, fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              确认支付
            </Button>
            <Text type="secondary" style={{ display: 'block', marginTop: 16, fontSize: 12 }}>
              这是模拟支付页面，点击上方按钮即可完成支付
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
}
