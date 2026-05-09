import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Card, Form, Input, Result, Spin, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import {
  apiWechatOauthUrl,
  apiWechatQrCheckIn,
  apiWechatBindAndCheckIn,
} from '@/api/member';

const { Text } = Typography;

type CheckinResult = { success: boolean; message: string; memberName?: string };

export default function QrCheckIn() {
  const { token: pathToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => pathToken || searchParams.get('token') || '', [pathToken, searchParams]);
  const code = searchParams.get('code') || '';

  const [loading, setLoading] = useState(true);
  const [bindToken, setBindToken] = useState('');
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [bindSubmitting, setBindSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setResult({ success: false, message: '签到码不存在或已失效，请重新扫码' });
      return;
    }

    if (!code) {
      apiWechatOauthUrl(token)
        .then((res) => {
          window.location.replace(res.url);
        })
        .catch((err: any) => {
          const msg = err?.response?.data?.message || err?.message || '微信授权失败';
          setResult({ success: false, message: msg });
          setLoading(false);
        });
      return;
    }

    apiWechatQrCheckIn(token, code)
      .then((res) => {
        if (res.status === 'BIND_REQUIRED' && res.bind_token) {
          setBindToken(res.bind_token);
          setLoading(false);
          return;
        }
        setResult({ success: true, message: '签到成功，欢迎入场！', memberName: res.member_name });
        setLoading(false);
      })
      .catch((err: any) => {
        const msg = err?.response?.data?.message || err?.message || '签到失败';
        setResult({ success: false, message: msg });
        setLoading(false);
      });
  }, [token, code]);

  const onBind = async (values: { member_no: string; phone: string }) => {
    if (!bindToken) return;
    setBindSubmitting(true);
    try {
      const res = await apiWechatBindAndCheckIn({
        bind_token: bindToken,
        member_no: values.member_no,
        phone: values.phone,
      });
      setResult({ success: true, message: '绑定并签到成功，欢迎入场！', memberName: res.member_name });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '绑定失败';
      setResult({ success: false, message: msg });
    } finally {
      setBindSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f5ff' }}>
        <Spin size="large" tip="正在处理微信签到..." />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', background: 'linear-gradient(135deg, #07c160 0%, #06ad56 100%)',
      padding: 20,
    }}>
      <Card style={{ width: 420, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {!result && bindToken ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h3 style={{ marginBottom: 8 }}>首次扫码，请先绑定会员</h3>
              <Text type="secondary">请输入会员编号和手机号完成绑定并签到</Text>
            </div>
            <Form form={form} layout="vertical" onFinish={onBind}>
              <Form.Item name="member_no" label="会员编号" rules={[{ required: true, message: '请输入会员编号' }]}>
                <Input placeholder="例如 M202404010001" />
              </Form.Item>
              <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                <Input placeholder="请输入会员档案绑定手机号" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={bindSubmitting} style={{ background: '#07c160', borderColor: '#07c160' }}>
                绑定并签到
              </Button>
            </Form>
          </>
        ) : result?.success ? (
          <Result
            icon={<CheckCircleOutlined style={{ color: '#07c160' }} />}
            title="签到成功"
            subTitle={
              <div>
                <div style={{ fontSize: 16, marginBottom: 8 }}>
                  {result.memberName ? `${result.memberName}，欢迎入场！` : '欢迎入场！'}
                </div>
                <Text type="secondary">{result.message}</Text>
              </div>
            }
            extra={<Button type="primary" onClick={() => navigate('/')} style={{ background: '#07c160', borderColor: '#07c160' }}>返回首页</Button>}
          />
        ) : (
          <Result
            status="error"
            title="签到失败"
            subTitle={result?.message || '签到失败'}
            extra={<Button onClick={() => navigate('/')}>返回首页</Button>}
          />
        )}
      </Card>
    </div>
  );
}
