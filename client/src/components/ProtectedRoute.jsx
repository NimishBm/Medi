import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, token } = useSelector((state) => state.auth);

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role
  if (
    requiredRoles.length > 0 &&
    !requiredRoles.includes(user.role)
  ) {
    return <Navigate to="/" replace />;
  }

  // Authorized
  return children;
};