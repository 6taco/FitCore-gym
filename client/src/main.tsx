import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#4f6f8f',
          colorSuccess: '#5cb85c',
          colorWarning: '#f0a230',
          colorError: '#d9534f',
          borderRadius: 8,
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
        },
        components: {
          Layout: {
            siderBg: '#1e293b',
            headerBg: '#ffffff',
          },
          Menu: {
            darkItemBg: '#1e293b',
            darkSubMenuItemBg: '#162032',
            darkItemSelectedBg: 'rgba(79,111,143,0.35)',
            darkItemHoverBg: 'rgba(255,255,255,0.06)',
          },
          Card: {
            borderRadiusLG: 12,
          },
          Table: {
            borderRadiusLG: 10,
          },
          Button: {
            borderRadius: 8,
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
