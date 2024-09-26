import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from 'store/rootReducer';

const RedirectBasedOnRole = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />; // Redirect to login if not authenticated
  }

  // Redirect based on role
  if (user.role === 'ADMIN') {
    return <Navigate to="/dashboard/admins" replace />;
  } else if (user.role === 'USER') {
    return <Navigate to="/dashboard/users" replace />;
  }

  // Fallback, in case no role matches
  return <Navigate to="/not-authorized" replace />;
};

export default RedirectBasedOnRole;
