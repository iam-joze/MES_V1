import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type Role } from '../../contexts/AuthContext';

const CONSOLE_ROOT: Record<Role, string> = {
  EXECUTIVE: '/executive',
  MANAGER: '/manager',
  OPERATOR: '/operator',
};

export function ProtectedRoute({ role }: { role: Role }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={CONSOLE_ROOT[user.role]} replace />;
  }

  return <Outlet />;
}
