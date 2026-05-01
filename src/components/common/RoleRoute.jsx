import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const RoleRoute = ({ children, roles }) => {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) return <Navigate to={`/${user?.role}/dashboard`} replace />;
  return children;
};

export default RoleRoute;
