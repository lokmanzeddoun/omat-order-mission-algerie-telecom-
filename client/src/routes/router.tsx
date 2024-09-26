/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from 'react';
import { Outlet, createBrowserRouter } from 'react-router-dom';
import AuthLayout from 'layouts/auth-layout';
import Splash from 'components/loader/Splash';
import PageLoader from 'components/loader/PageLoader';
import MainLayout from 'layouts/main-layout';
import paths, { rootPaths } from './paths';

const App = lazy(() => import('App'));
const Signin = lazy(() => import('pages/authentication/Signin'));
import Users from 'pages/users';
import Dashboard from 'pages/Dashboard';
import ProtectedRoute from 'ProtectedRoute';
import Structures from 'pages/structures';
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
              element: <Signin />,
            },
          ],
        },
        {
          path: rootPaths.dashboard,
          element: (
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          ),
          children: [
            {
              path: paths.home,
              element: <Dashboard />,
            },
            {
              path: paths.users,
              element: <Users />,
            },
            {
              path: paths.structures,
              element: <Structures />,
            },
          ],
        },
      ],
    },
  ],
  {
    basename: '/omat',
  },
);

export default router;
