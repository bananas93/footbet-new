import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from 'store';
import { AuthRoutesEnum } from './AuthRoutes';

interface RequireAdminRouteProps {
  children: JSX.Element;
}

const RequireAdminRoute: React.FC<RequireAdminRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const role = useAppSelector((state) => state.user.user?.role);

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={`${AuthRoutesEnum.SignIn}?from=${encodeURIComponent(from)}`} replace />;
  }

  if (role !== 'admin') {
    return (
      <section style={{ maxWidth: 560, margin: '80px auto', padding: 24, textAlign: 'center' }}>
        <h2>Доступ заборонено</h2>
        <p>Ваш акаунт не має ролі admin у таблиці profiles.</p>
        <Link to="/">Повернутися на головну</Link>
      </section>
    );
  }

  return children;
};

export default RequireAdminRoute;
