import { useAppSelector } from 'store';
import { Link, useLocation } from 'react-router-dom';
import { AuthRoutesEnum } from './AuthRoutes';
import styles from './RequireAuthRoute.module.scss';
import { useI18n } from 'i18n';

interface RequireAuthRouteProps {
  children: JSX.Element;
}

const RequireAuthRoute: React.FC<RequireAuthRouteProps> = ({ children }) => {
  const { t } = useI18n();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (isAuthenticated) {
    return children;
  }

  const signInHref = `${AuthRoutesEnum.SignIn}?from=${encodeURIComponent(`${location.pathname}${location.search}`)}`;

  return (
    <section className={styles.gate}>
      <h2 className={styles.title}>{t('guard.requireAuth.title')}</h2>
      <p className={styles.subtitle}>{t('guard.requireAuth.subtitle')}</p>
      <Link to={signInHref} className={styles.button}>
        {t('guard.requireAuth.button')}
      </Link>
    </section>
  );
};

export default RequireAuthRoute;
