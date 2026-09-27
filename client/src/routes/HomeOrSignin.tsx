import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
import PageLoader from 'components/loader/PageLoader';
import { Navigate, useLocation } from 'react-router-dom';
import { rootPaths } from './paths';
import Signin from 'pages/authentication/Signin';

const HomeOrSignin: React.FC = () => {
  const { loading, isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  const from = (useLocation().state as { from?: unknown } | null)?.from;

  if (loading) return <PageLoader />;

  if (isAuthenticated) {
    if (user?.mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }
    // Back to a scanned QR link after sign-in. Limited to /scan/ so a new user
    // on a shared machine isn't sent to the previous user's page.
    if (typeof from === 'string' && from.startsWith('/scan/')) {
      return <Navigate to={from} replace />;
    }
    // Redirect to dashboard root (router basename handles /omat)
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      return <Navigate to={`/${rootPaths.dashboard}/admins`} replace />;
    }
    if (user?.role === 'USER') {
      return <Navigate to={`/${rootPaths.dashboard}/users`} replace />;
    }
    return <Navigate to={`/${rootPaths.dashboard}`} replace />;
  }

  return <Signin />;
};

export default HomeOrSignin;
