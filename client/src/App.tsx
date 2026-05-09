import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from './router';
import ErrorBoundary from './components/ErrorBoundary';
import { useThemeStore } from './stores/themeStore';

export default function App() {
  const dark = useThemeStore((s) => s.dark);
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{ algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm }}
    >
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </ConfigProvider>
  );
}
