import { useMemo, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Breadcrumb } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { MENU_TREE, MenuNode } from '@/config/menu';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import NotificationBell from '@/components/NotificationBell';
import { useThemeStore } from '@/stores/themeStore';

const { Header, Sider, Content } = Layout;

function filterMenuByPermission(
  nodes: MenuNode[],
  has: (code: string | string[]) => boolean,
): MenuProps['items'] {
  const items: MenuProps['items'] = [];
  for (const n of nodes) {
    if (n.permission && !has(n.permission) && !n.disabled) continue;
    const children = n.children ? filterMenuByPermission(n.children, has) : undefined;
    if (n.children && (!children || children.length === 0)) continue;
    items!.push({
      key: n.key,
      icon: n.icon,
      label: n.label,
      disabled: n.disabled,
      children,
    } as any);
  }
  return items;
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/': '首页',
  '/members': '会员管理',
  '/memberships': '会籍管理',
  '/courses/schedule': '课程排期',
  '/courses/library': '课程库',
  '/courses/coaches': '教练管理',
  '/products': '商品与库存',
  '/finance/cashier': '收银台',
  '/finance/orders': '订单管理',
  '/finance/reports': '财务报表',
  '/system/users': '用户管理',
  '/system/roles': '角色权限',
  '/system/audit': '操作日志',
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuthStore();
  const dark = useThemeStore((s) => s.dark);
  const toggleTheme = useThemeStore((s) => s.toggle);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menuItems = useMemo(
    () => filterMenuByPermission(MENU_TREE, hasPermission),
    [user?.permissions, user?.roleCode],
  );

  const openKeys = useMemo(() => {
    const keys: string[] = [];
    if (location.pathname.startsWith('/system')) keys.push('/system');
    if (location.pathname.startsWith('/courses')) keys.push('/courses');
    if (location.pathname.startsWith('/finance')) keys.push('/finance');
    return keys;
  }, [location.pathname]);

  const userMenu: MenuProps['items'] = [
    { key: 'change-password', icon: <KeyOutlined />, label: '修改密码', onClick: () => setPwdOpen(true) },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: handleLogout },
  ];

  const crumbs = useMemo(() => {
    const items: { title: React.ReactNode }[] = [{ title: <Link to="/">首页</Link> }];
    const name = BREADCRUMB_MAP[location.pathname];
    if (name && location.pathname !== '/') {
      items.push({ title: name });
    }
    return items;
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={230}
        theme="dark"
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.08)' }}
      >
        <div className="sider-logo">
          <div className="sider-logo-icon">G</div>
          {!collapsed && <span className="sider-logo-text">GymOS</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            height: 56,
            lineHeight: '56px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{ fontSize: 16, cursor: 'pointer', color: '#64748b', padding: '4px 0' }}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
            <Breadcrumb items={crumbs} style={{ fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span onClick={toggleTheme} style={{ cursor: 'pointer', fontSize: 16 }} title="切换主题">{dark ? '☀️' : '🌙'}</span>
          <NotificationBell />
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                padding: '4px 12px',
                borderRadius: 8,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Avatar
                size={32}
                icon={<UserOutlined />}
                style={{ background: 'linear-gradient(135deg, #4f6f8f, #6a94b8)' }}
              />
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>
                  {user?.realName || user?.username}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{user?.roleName}</div>
              </div>
            </div>
          </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 0,
            padding: 24,
            background: '#f0f2f5',
            minHeight: 280,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
      <ChangePasswordModal open={pwdOpen} onClose={() => setPwdOpen(false)} />
    </Layout>
  );
}
