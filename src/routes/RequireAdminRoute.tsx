import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from 'store';
import { AuthRoutesEnum } from './AuthRoutes';
import { useI18n } from 'i18n';

interface RequireAdminRouteProps {
  children: JSX.Element;
}

const RequireAdminRoute: React.FC<RequireAdminRouteProps> = ({ children }) => {
  const { t } = useI18n();
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
        <h2>{t('guard.admin.title')}</h2>
        <p>{t('guard.admin.subtitle')}</p>
        <Link to="/">{t('guard.admin.backHome')}</Link>
      </section>
    );
  }

  return children;
};

export default RequireAdminRoute;
