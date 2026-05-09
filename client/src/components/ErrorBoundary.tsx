import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from 'antd';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', textAlign: 'center', padding: 24, background: '#f8fafc',
        }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, color: '#fca5a5' }}>Oops</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#475569', margin: '16px 0 8px' }}>页面出了点问题</div>
          <div style={{ color: '#94a3b8', maxWidth: 400, marginBottom: 20 }}>
            {this.state.error?.message || '发生了未知错误，请刷新页面或返回首页重试。'}
          </div>
          <Button type="primary" size="large" style={{ borderRadius: 10 }} onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}>
            返回首页
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
