import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;

    if (!token || !user) {
      redirectedRef.current = true;
      navigate('/login', { replace: true });
    } else if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      redirectedRef.current = true;
      navigate('/', { replace: true });
    }
  }, [token, user?.role]);

  if (!token || !user) return null;
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) return null;

  return children;
};
