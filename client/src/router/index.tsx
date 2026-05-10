import { lazy, Suspense } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '@/layouts/MainLayout';
import { RequireAuth, RequirePermission } from './guards';

/* -------- 路由懒加载：每个页面独立 chunk，首屏只加载当前路由 -------- */
const LoginPage       = lazy(() => import('@/pages/Login'));
const Dashboard       = lazy(() => import('@/pages/Dashboard'));
const Forbidden       = lazy(() => import('@/pages/Error/Forbidden'));
const NotFound        = lazy(() => import('@/pages/Error/NotFound'));
const MembersPage     = lazy(() => import('@/pages/Members'));
const MembershipsPage = lazy(() => import('@/pages/Memberships'));
const CheckInsPage    = lazy(() => import('@/pages/Members/CheckIns'));
const QrCheckIn       = lazy(() => import('@/pages/Members/QrCheckIn'));
const SchedulePage    = lazy(() => import('@/pages/Courses/SchedulePage'));
const CourseLibraryPage = lazy(() => import('@/pages/Courses/Library'));
const CoachesPage     = lazy(() => import('@/pages/Courses/Coaches'));
const CoachRankingPage = lazy(() => import('@/pages/Courses/CoachRanking'));
const ProductsPage    = lazy(() => import('@/pages/Finance/Products'));
const CashierPage     = lazy(() => import('@/pages/Finance/Cashier'));
const OrdersPage      = lazy(() => import('@/pages/Finance/Orders'));
const ReportsPage     = lazy(() => import('@/pages/Finance/Reports'));
const MockPay         = lazy(() => import('@/pages/Finance/MockPay'));
const UserListPage    = lazy(() => import('@/pages/System/UserList'));
const RoleListPage    = lazy(() => import('@/pages/System/RoleList'));
const AuditLogPage    = lazy(() => import('@/pages/System/AuditLog'));
const SettingsPage    = lazy(() => import('@/pages/System/Settings'));

/* Suspense 全局加载占位 */
const LazyLoad = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}><Spin size="large" /></div>}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  { path: '/login', element: <LazyLoad><LoginPage /></LazyLoad> },
  { path: '/mock-pay/:orderId', element: <LazyLoad><MockPay /></LazyLoad> },
  { path: '/qr-checkin', element: <LazyLoad><QrCheckIn /></LazyLoad> },
  { path: '/qr-checkin/:token', element: <LazyLoad><QrCheckIn /></LazyLoad> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <LazyLoad><Dashboard /></LazyLoad> },
      { path: '403', element: <LazyLoad><Forbidden /></LazyLoad> },
      {
        path: 'members',
        element: (
          <RequirePermission code="member:view">
            <LazyLoad><MembersPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'memberships',
        element: (
          <RequirePermission code="membership:view">
            <LazyLoad><MembershipsPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'check-ins',
        element: (
          <RequirePermission code="checkin:view">
            <LazyLoad><CheckInsPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'courses',
        element: <Navigate to="/courses/schedule" replace />,
      },
      {
        path: 'courses/schedule',
        element: (
          <RequirePermission code="course:view">
            <LazyLoad><SchedulePage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'courses/library',
        element: (
          <RequirePermission code="course:view">
            <LazyLoad><CourseLibraryPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'courses/coaches',
        element: (
          <RequirePermission code="course:view">
            <LazyLoad><CoachesPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'courses/ranking',
        element: (
          <RequirePermission code="member:view">
            <LazyLoad><CoachRankingPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'products',
        element: (
          <RequirePermission code="product:view">
            <LazyLoad><ProductsPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'finance',
        element: <Navigate to="/finance/cashier" replace />,
      },
      {
        path: 'finance/cashier',
        element: (
          <RequirePermission code="order:manage">
            <LazyLoad><CashierPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'finance/orders',
        element: (
          <RequirePermission code="order:view">
            <LazyLoad><OrdersPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'finance/reports',
        element: (
          <RequirePermission code="report:view">
            <LazyLoad><ReportsPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'system/users',
        element: (
          <RequirePermission code="system:user:view">
            <LazyLoad><UserListPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'system/roles',
        element: (
          <RequirePermission code="system:role:view">
            <LazyLoad><RoleListPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'system/audit',
        element: (
          <RequirePermission code="system:audit:view">
            <LazyLoad><AuditLogPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      {
        path: 'system/settings',
        element: (
          <RequirePermission code="system:role:manage">
            <LazyLoad><SettingsPage /></LazyLoad>
          </RequirePermission>
        ),
      },
      { path: '*', element: <LazyLoad><NotFound /></LazyLoad> },
    ],
  },
]);
