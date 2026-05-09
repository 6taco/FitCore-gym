import {
  DashboardOutlined,
  TeamOutlined,
  IdcardOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  DollarOutlined,
  SettingOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

export interface MenuNode {
  key: string;
  label: string;
  icon?: ReactNode;
  permission?: string;      // 有则需校验
  disabled?: boolean;       // 未来阶段占位
  children?: MenuNode[];
}

export const MENU_TREE: MenuNode[] = [
  { key: '/', label: '数据看板', icon: <DashboardOutlined /> },
  { key: '/members', label: '会员管理', icon: <TeamOutlined />, permission: 'member:view' },
  { key: '/memberships', label: '会籍与卡种', icon: <IdcardOutlined />, permission: 'membership:view' },
  { key: '/check-ins', label: '入场签到', icon: <IdcardOutlined />, permission: 'checkin:view' },
  {
    key: '/courses',
    label: '课程与预约',
    icon: <CalendarOutlined />,
    permission: 'course:view',
    children: [
      { key: '/courses/schedule', label: '课表', icon: <CalendarOutlined />, permission: 'course:view' },
      { key: '/courses/library', label: '课程库', icon: <CalendarOutlined />, permission: 'course:view' },
      { key: '/courses/coaches', label: '教练', icon: <CalendarOutlined />, permission: 'course:view' },
      { key: '/courses/ranking', label: '教练绩效', icon: <CalendarOutlined />, permission: 'member:view' },
    ],
  },
  { key: '/products', label: '商品与库存', icon: <ShoppingOutlined />, permission: 'product:view' },
  {
    key: '/finance',
    label: '财务与订单',
    icon: <DollarOutlined />,
    permission: 'order:view',
    children: [
      { key: '/finance/cashier', label: '收银台', icon: <DollarOutlined />, permission: 'order:manage' },
      { key: '/finance/orders', label: '订单管理', icon: <DollarOutlined />, permission: 'order:view' },
      { key: '/finance/reports', label: '财务报表', icon: <DollarOutlined />, permission: 'report:view' },
    ],
  },
  {
    key: '/system',
    label: '系统管理',
    icon: <SettingOutlined />,
    children: [
      { key: '/system/users', label: '用户管理', icon: <UserOutlined />, permission: 'system:user:view' },
      { key: '/system/roles', label: '角色权限', icon: <SafetyCertificateOutlined />, permission: 'system:role:view' },
      { key: '/system/audit', label: '操作日志', icon: <FileSearchOutlined />, permission: 'system:audit:view' },
      { key: '/system/settings', label: '系统设置', icon: <SettingOutlined />, permission: 'system:role:manage' },
    ],
  },
];
