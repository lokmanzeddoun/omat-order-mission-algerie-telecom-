import { Suspense, lazy, type ReactNode } from 'react';
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import AuthLayout from 'layouts/auth-layout';
import AppShell from 'layouts/app-shell';
import { Loader } from 'components/ui';
import paths, { rootPaths } from './paths';

import HomeOrSignin from './HomeOrSignin';
import ProtectedRoute from 'ProtectedRoute';
import RedirectBasedOnRole from 'RedirectBasedRole';

const App = lazy(() => import('App'));
const ForgotPassword = lazy(() => import('pages/authentication/ForgotPassword'));
const Users = lazy(() => import('pages/users'));
const Structures = lazy(() => import('pages/structures'));
const NotFoundPage = lazy(() => import('pages/not-found'));
const UserDashboard = lazy(() => import('pages/UserDashboard'));
const MyProfile = lazy(() => import('pages/userProfile'));
const OrderDashboard = lazy(() => import('pages/ordres'));
const DataGridWithJson = lazy(() => import('pages/barem'));
const Archive = lazy(() => import('pages/archive'));
const DecomptesPage = lazy(() => import('pages/decomptes'));
const AdminComments = lazy(() => import('pages/admin/Comments'));
const AnalyticsDashboard = lazy(() => import('pages/admin/AnalyticsDashboard'));

/** Authenticated page area: role guard + shell + lazy page boundary. */
const shell = (allowedRoles?: string[]): ReactNode => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    <AppShell>
      <Suspense fallback={<Loader />}>
        <Outlet />
      </Suspense>
    </AppShell>
  </ProtectedRoute>
);

const router = createBrowserRouter(
  [
    {
      element: (
        <Suspense fallback={<Loader />}>
          <App />
        </Suspense>
      ),
      children: [
        {
          path: '/',
          element: (
            <AuthLayout>
              <Suspense fallback={<Loader />}>
                <Outlet />
              </Suspense>
            </AuthLayout>
          ),
          children: [
            { index: true, element: <HomeOrSignin /> },
            { path: 'authentication/forgot-password', element: <ForgotPassword /> },
          ],
        },
        {
          path: rootPaths.dashboard,
          element: (
            <ProtectedRoute>
              <RedirectBasedOnRole />
            </ProtectedRoute>
          ),
        },
        {
          path: paths.admins,
          element: shell(['ADMIN', 'SUPER_ADMIN']),
          children: [
            { index: true, element: <OrderDashboard /> },
            { path: 'users', element: <Users /> },
            { path: 'structures', element: <Structures /> },
            { path: 'barem', element: <DataGridWithJson /> },
            { path: 'decomptes', element: <DecomptesPage /> },
            { path: 'support', element: <AdminComments /> },
            { path: 'archive', element: <Archive /> },
            { path: 'analytics', element: <AnalyticsDashboard /> },
          ],
        },
        {
          path: paths.users,
          element: shell(['USER']),
          children: [{ index: true, element: <UserDashboard /> }],
        },
        {
          path: paths.me,
          element: shell(),
          children: [{ index: true, element: <MyProfile /> }],
        },
        {
          path: paths.notFound,
          element: (
            <Suspense fallback={<Loader />}>
              <NotFoundPage />
            </Suspense>
          ),
        },
        { path: '*', element: <Navigate to={paths.notFound} replace /> },
      ],
    },
  ],
  {
    basename: '/omat',
  },
);

export default router;
