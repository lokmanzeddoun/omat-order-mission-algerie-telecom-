import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from 'store/rootReducer';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[]; // New prop for allowed roles
}

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const { token, isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Check if the user is authenticated
  if (!token || !isAuthenticated) {
    localStorage.removeItem('user'); // Remove user info from localStorage if not authenticated
    localStorage.removeItem('token'); // Remove user info from localStorage if not authenticated
    return <Navigate to="/" replace />;
  }

  // Check if the user's role is included in the allowedRoles array (if roles are required)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/not-found" replace />;
  }

  return children;
};

export default ProtectedRoute;
