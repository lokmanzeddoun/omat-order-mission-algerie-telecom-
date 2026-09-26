import { Suspense, lazy } from 'react';
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import AuthLayout from 'layouts/auth-layout';
import Splash from 'components/loader/Splash';
import PageLoader from 'components/loader/PageLoader';
import MainLayout from 'layouts/main-layout';
import paths, { rootPaths } from './paths';

import HomeOrSignin from './HomeOrSignin';
import ProtectedRoute from 'ProtectedRoute';
import UserLayout from 'layouts/user-layout';
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

const router = createBrowserRouter(
  [
    {
      element: (
        <Suspense fallback={<Splash />}>
          <App />
        </Suspense>
      ),
      children: [
        {
          path: '/',
          element: (
            <AuthLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </AuthLayout>
          ),
            children: [
            {
              index: true,
              element: <HomeOrSignin />,
            },
            {
              path: 'authentication/forgot-password',
              element: <ForgotPassword />,
            },
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
          path: `${rootPaths.dashboard}/admins`, // This is the parent route for admins
          element: (
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <MainLayout>
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          ),
          children: [
            {
              path: 'users', // Relative path, starting with the parent's path
              element: <Users />,
            },
            {
              path: 'structures', // Relative path, starting with the parent's path
              element: <Structures />,
            },
            {
              path: '', // Relative path, starting with the parent's path
              element: <OrderDashboard />,
            },
            {
              path: "barem",
              element: <DataGridWithJson />,
            },
            {
              path: 'decomptes',
              element: <DecomptesPage />,
            },
            {
              path: 'support',
              element: <AdminComments />,
            },
            {
              path: 'archive',
              element: <Archive />,
            },
            {
              path: 'analytics',
              element: <AnalyticsDashboard />,
            },
          ],
        },
        {
          path: `${rootPaths.dashboard}/users`, // This is the parent route for regular users
          element: (
            <ProtectedRoute allowedRoles={['USER']}>
              <UserLayout>
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </UserLayout>
            </ProtectedRoute>
          ),
          children: [
            {
              path: '', // Represents the home route under users
              element: <UserDashboard />, // Main dashboard for users
            },
          ],
        },
        {
          path: paths.me,
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <MyProfile />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: paths.notFound,
          element: (
            <Suspense fallback={<PageLoader />}>
              <NotFoundPage />
            </Suspense>
          ),
        },
        {
          path: '*',
          element: <Navigate to={paths.notFound} replace />,
        },
      ],
    },
  ],
  {
    basename: '/omat',
  },
);

export default router;
