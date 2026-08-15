import { useAppSelector } from 'store';
import { Link, useLocation } from 'react-router-dom';
import { AuthRoutesEnum } from './AuthRoutes';
import styles from './RequireAuthRoute.module.scss';

interface RequireAuthRouteProps {
  children: JSX.Element;
}

const RequireAuthRoute: React.FC<RequireAuthRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (isAuthenticated) {
    return children;
  }

  const signInHref = `${AuthRoutesEnum.SignIn}?from=${encodeURIComponent(`${location.pathname}${location.search}`)}`;

  return (
    <section className={styles.gate}>
      <h2 className={styles.title}>Функціонал доступний після входу</h2>
      <p className={styles.subtitle}>
        Перегляд турнірів і матчів відкритий для всіх, але ця секція доступна лише авторизованим користувачам.
      </p>
      <Link to={signInHref} className={styles.button}>
        Увійти
      </Link>
    </section>
  );
};

export default RequireAuthRoute;
