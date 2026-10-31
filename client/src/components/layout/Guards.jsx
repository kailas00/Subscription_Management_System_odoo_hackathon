import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, homeFor } from '../../context/AuthContext.jsx';
import { Spinner } from '../ui/index.js';

/** <RequireRole roles={['ADMIN']}> … — unauthenticated → /login, wrong role → their home */
export function RequireRole({ roles, children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <Spinner label="Restoring your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return children;
}

export function GuestOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Spinner />;
  return user ? <Navigate to={homeFor(user)} replace /> : children;
}
