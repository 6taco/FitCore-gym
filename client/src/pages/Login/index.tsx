import { useState } from 'react';
import { Button, Form, Input, message, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiLogin, LoginParams } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';

const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  const onFinish = async (values: LoginParams) => {
    setLoading(true);
    try {
      const { token, user, refreshToken } = await apiLogin(values);
      setAuth(token, user, refreshToken);
      message.success(`欢迎回来，${user.realName || user.username}`);
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch {
      // error already toasted in interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* 左侧品牌区 */}
      <div
        style={{
          flex: '0 0 45%',
          background: 'linear-gradient(160deg, #1e293b 0%, #334155 40%, #4f6f8f 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 装饰圆形 */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #4f6f8f 0%, #6a94b8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 22, fontWeight: 700,
            }}>
              G
            </div>
            <span style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 600, letterSpacing: 1 }}>
              GymOS
            </span>
          </div>
          <Title level={2} style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: 16, lineHeight: 1.3 }}>
            全方位健身房<br />管理解决方案
          </Title>
          <Paragraph style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.8, maxWidth: 380 }}>
            覆盖会员管理、会籍办理、课程预约、收银结账、库存管控、财务报表等完整业务场景。
          </Paragraph>
          <div style={{ display: 'flex', gap: 24, marginTop: 36 }}>
            {[
              { num: '4', label: '角色权限' },
              { num: '10+', label: '功能模块' },
              { num: '6', label: '迭代阶段' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ color: '#e2e8f0', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{item.num}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧登录区 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: 24,
        }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <Title level={3} style={{ margin: 0, color: '#1e293b' }}>登录</Title>
            <Text style={{ color: '#94a3b8' }}>请输入账号和密码以继续</Text>
          </div>

          <Form
            layout="vertical"
            size="large"
            initialValues={{ username: 'admin', password: 'admin123' }}
            onFinish={onFinish}
            requiredMark={false}
          >
            <Form.Item
              name="username"
              label={<span style={{ color: '#475569', fontWeight: 500 }}>用户名</span>}
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                placeholder="请输入用户名"
                autoComplete="username"
                style={{ borderRadius: 10, height: 46 }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={<span style={{ color: '#475569', fontWeight: 500 }}>密码</span>}
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder="请输入密码"
                autoComplete="current-password"
                style={{ borderRadius: 10, height: 46 }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 46, borderRadius: 10, fontWeight: 600, fontSize: 15 }}
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          <div style={{ marginTop: 24, padding: '12px 16px', background: '#f1f5f9', borderRadius: 10 }}>
            <Text style={{ fontSize: 12, color: '#64748b' }}>
              演示账号：admin / admin123 &nbsp;|&nbsp; staff / staff123
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
