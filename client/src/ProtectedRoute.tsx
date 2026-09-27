import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import PageLoader from 'components/loader/PageLoader';
import { RootState } from 'store/rootReducer';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[]; // New prop for allowed roles
}

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const { token, isAuthenticated, user, loading } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // Check if the user is authenticated
  // If app still determining auth state, show loader to avoid login flash
  if (loading) {
    return <PageLoader />;
  }

  if (!token || !isAuthenticated) {
    // Remember the page so sign-in can return to it (e.g. a scanned QR code).
    return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
  }

  // Check if the user's role is included in the allowedRoles array (if roles are required)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/not-found" replace />;
  }

  return children;
};

export default ProtectedRoute;
