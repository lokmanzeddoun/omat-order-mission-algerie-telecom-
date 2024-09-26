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
import NotFoundPage from 'pages/not-found';
import UserLayout from 'layouts/user-layout';
import UserDashboard from 'pages/UserDashboard';
import RedirectBasedOnRole from 'RedirectBasedRole';
import UserProfile from 'pages/UserProfile';
import { useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';

const UserProfileWrapper = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  // Pass the user as a prop to UserProfile
  return <UserProfile user={user} />;
};

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
              <RedirectBasedOnRole />
            </ProtectedRoute>
          ),
        },
        {
          path: `${rootPaths.dashboard}/admins`, // This is the parent route for admins
          element: (
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MainLayout>
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          ),
          children: [
            {
              path: '', // Represents the home route under admins
              element: <Dashboard />, // Main dashboard for admins
            },
            {
              path: 'users', // Relative path, starting with the parent's path
              element: <Users />,
            },
            {
              path: 'structures', // Relative path, starting with the parent's path
              element: <Structures />,
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
          path: paths.notFound,
          element: <NotFoundPage />,
        },
        {
          path: paths.me,
          element: <UserProfileWrapper />,
        },
      ],
    },
  ],
  {
    basename: '/omat',
  },
);

export default router;
