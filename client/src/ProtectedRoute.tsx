import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from 'store/rootReducer';

interface ProtectedRouteProps {
  children: JSX.Element; // Type for children prop
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { token, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!token && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
