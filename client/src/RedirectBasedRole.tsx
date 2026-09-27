import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from 'store/rootReducer';
import paths from 'routes/paths';

const RedirectBasedOnRole = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />; // Redirect to login if not authenticated
  }

  // Redirect based on role
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return <Navigate to={paths.admins} replace />;
  } else if (user.role === 'USER') {
    return <Navigate to={paths.users} replace />;
  }

  // Fallback, in case no role matches
  return <Navigate to={paths.notFound} replace />;
};

export default RedirectBasedOnRole;
