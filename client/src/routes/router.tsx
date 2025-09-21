import { Suspense, lazy } from 'react';
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import AuthLayout from 'layouts/auth-layout';
import Splash from 'components/loader/Splash';
import PageLoader from 'components/loader/PageLoader';
import MainLayout from 'layouts/main-layout';
import paths, { rootPaths } from './paths';

const App = lazy(() => import('App'));
import HomeOrSignin from './HomeOrSignin';
import ForgotPassword from 'pages/authentication/ForgotPassword';
import Users from 'pages/users';
import ProtectedRoute from 'ProtectedRoute';
import Structures from 'pages/structures';
import NotFoundPage from 'pages/not-found';
import UserLayout from 'layouts/user-layout';
import UserDashboard from 'pages/UserDashboard';
import RedirectBasedOnRole from 'RedirectBasedRole';
import MyProfile from 'pages/userProfile';
import OrderDashboard from 'pages/ordres';
import DataGridWithJson from 'pages/barem';
import Archive from 'pages/archive';
import DecomptesPage from 'pages/decomptes';
import AdminComments from 'pages/admin/Comments';

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
              <MyProfile />
            </ProtectedRoute>
          ),
        },
        {
          path: paths.notFound,
          element: <NotFoundPage />,
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
