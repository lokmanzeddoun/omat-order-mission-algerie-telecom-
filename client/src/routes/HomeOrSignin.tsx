import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
import PageLoader from 'components/loader/PageLoader';
import { Navigate } from 'react-router-dom';
import { rootPaths } from './paths';
import Signin from 'pages/authentication/Signin';

const HomeOrSignin: React.FC = () => {
  const { loading, isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  if (loading) return <PageLoader />;

  if (isAuthenticated) {
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
