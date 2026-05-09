import { Navigate, createBrowserRouter } from 'react-router-dom';
import LoginPage from '@/pages/Login';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Forbidden from '@/pages/Error/Forbidden';
import UserListPage from '@/pages/System/UserList';
import RoleListPage from '@/pages/System/RoleList';
import AuditLogPage from '@/pages/System/AuditLog';
import SettingsPage from '@/pages/System/Settings';
import MembersPage from '@/pages/Members';
import MembershipsPage from '@/pages/Memberships';
import CheckInsPage from '@/pages/Members/CheckIns';
import SchedulePage from '@/pages/Courses/SchedulePage';
import CourseLibraryPage from '@/pages/Courses/Library';
import CoachesPage from '@/pages/Courses/Coaches';
import CoachRankingPage from '@/pages/Courses/CoachRanking';
import ProductsPage from '@/pages/Finance/Products';
import CashierPage from '@/pages/Finance/Cashier';
import OrdersPage from '@/pages/Finance/Orders';
import ReportsPage from '@/pages/Finance/Reports';
import NotFound from '@/pages/Error/NotFound';
import MockPay from '@/pages/Finance/MockPay';
import QrCheckIn from '@/pages/Members/QrCheckIn';
import { RequireAuth, RequirePermission } from './guards';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/mock-pay/:orderId', element: <MockPay /> },
  { path: '/qr-checkin', element: <QrCheckIn /> },
  { path: '/qr-checkin/:token', element: <QrCheckIn /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: '403', element: <Forbidden /> },
      {
        path: 'members',
        element: (
          <RequirePermission code="member:view">
            <MembersPage />
          </RequirePermission>
        ),
      },
      {
        path: 'memberships',
        element: (
          <RequirePermission code="membership:view">
            <MembershipsPage />
          </RequirePermission>
        ),
      },
      {
        path: 'check-ins',
        element: (
          <RequirePermission code="checkin:view">
            <CheckInsPage />
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
            <SchedulePage />
          </RequirePermission>
        ),
      },
      {
        path: 'courses/library',
        element: (
          <RequirePermission code="course:view">
            <CourseLibraryPage />
          </RequirePermission>
        ),
      },
      {
        path: 'courses/coaches',
        element: (
          <RequirePermission code="course:view">
            <CoachesPage />
          </RequirePermission>
        ),
      },
      {
        path: 'courses/ranking',
        element: (
          <RequirePermission code="member:view">
            <CoachRankingPage />
          </RequirePermission>
        ),
      },
      {
        path: 'products',
        element: (
          <RequirePermission code="product:view">
            <ProductsPage />
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
            <CashierPage />
          </RequirePermission>
        ),
      },
      {
        path: 'finance/orders',
        element: (
          <RequirePermission code="order:view">
            <OrdersPage />
          </RequirePermission>
        ),
      },
      {
        path: 'finance/reports',
        element: (
          <RequirePermission code="report:view">
            <ReportsPage />
          </RequirePermission>
        ),
      },
      {
        path: 'system/users',
        element: (
          <RequirePermission code="system:user:view">
            <UserListPage />
          </RequirePermission>
        ),
      },
      {
        path: 'system/roles',
        element: (
          <RequirePermission code="system:role:view">
            <RoleListPage />
          </RequirePermission>
        ),
      },
      {
        path: 'system/audit',
        element: (
          <RequirePermission code="system:audit:view">
            <AuditLogPage />
          </RequirePermission>
        ),
      },
      {
        path: 'system/settings',
        element: (
          <RequirePermission code="system:role:manage">
            <SettingsPage />
          </RequirePermission>
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
