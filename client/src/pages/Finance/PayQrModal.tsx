import { useEffect, useRef, useState } from 'react';
import { Modal, Typography, Spin, Result, Tag } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { apiOrderStatus } from '@/api/finance';

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  orderId: number | null;
  orderNo: string;
  totalAmount: number;
  payMethod: 'WECHAT' | 'ALIPAY';
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PayQrModal({ open, orderId, orderNo, totalAmount, payMethod, onSuccess, onCancel }: Props) {
  const [status, setStatus] = useState<'PENDING' | 'PAID' | 'TIMEOUT'>('PENDING');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(0);

  useEffect(() => {
    if (!open || !orderId) return;
    setStatus('PENDING');
    countRef.current = 0;

    timerRef.current = setInterval(async () => {
      try {
        const res = await apiOrderStatus(orderId);
        if (res.status === 'PAID') {
          setStatus('PAID');
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => onSuccess(), 1500);
        }
      } catch { /* ignore */ }

      countRef.current += 1;
      if (countRef.current > 150) {
        setStatus('TIMEOUT');
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 2000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, orderId]);

  const isWechat = payMethod === 'WECHAT';
  const color = isWechat ? '#07c160' : '#1677ff';
  const label = isWechat ? '微信支付' : '支付宝支付';

  const payUrl = `${window.location.origin}/mock-pay/${orderId}`;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={420}
      centered
      destroyOnClose
      title={null}
      closable={status === 'PENDING'}
    >
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        {status === 'PENDING' && (
          <>
            <Tag color={color} style={{ fontSize: 16, padding: '4px 16px', marginBottom: 16 }}>{label}</Tag>
            <Title level={3} style={{ margin: '8px 0', color: '#d9534f' }}>¥{totalAmount.toFixed(2)}</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>订单号：{orderNo}</Text>

            <div style={{
              display: 'inline-block', padding: 16, background: '#fff',
              border: `3px solid ${color}`, borderRadius: 12,
            }}>
              <QRCodeSVG value={payUrl} size={200} />
            </div>

            <div style={{ marginTop: 16 }}>
              <Spin size="small" />
              <Text type="secondary" style={{ marginLeft: 8 }}>
                请使用{isWechat ? '微信' : '支付宝'}扫描二维码完成支付
              </Text>
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
              （演示模式：可在浏览器打开二维码链接模拟支付）
            </Text>
          </>
        )}

        {status === 'PAID' && (
          <Result
            status="success"
            title="支付成功"
            subTitle={`订单号：${orderNo}，金额：¥${totalAmount.toFixed(2)}`}
          />
        )}

        {status === 'TIMEOUT' && (
          <Result
            status="warning"
            title="支付超时"
            subTitle="请刷新重试或联系管理员"
          />
        )}
      </div>
    </Modal>
  );
}
