import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import PageLoader from 'components/loader/PageLoader';
import { RootState } from 'store/rootReducer';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[]; // New prop for allowed roles
}

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const { token, isAuthenticated, user, loading } = useSelector((state: RootState) => state.auth);

  // If app still determining auth state, show loader to avoid login flash
  if (loading) {
    return <PageLoader />;
  }

  if (!token || !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if the user's role is included in the allowedRoles array (if roles are required)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/not-found" replace />;
  }

  return children;
};

export default ProtectedRoute;
