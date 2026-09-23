import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, token, authInitialized } = useSelector((state) => state.auth);

  // Wait until session restore (getMe call) has completed before making any
  // routing decision. Returning null here is safe — App.jsx already renders
  // nothing (also returns null) while !authInitialized, so this is belt-and-suspenders.
  if (!authInitialized) return null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};
