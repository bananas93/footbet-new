import cn from 'classnames';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAppSelector } from 'store';
import { RoutesEnum } from 'routes/AppRoutes';
import { AuthRoutesEnum } from 'routes/AuthRoutes';
import { getUserDisplayName, getUserInitials, resolveAssetUrl } from 'helpers';
import styles from './Header.module.scss';

const iconProps = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const BallIcon = () => (
  <svg {...iconProps} className={styles.brandIcon}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2l2.8 2-1 3.3h-3.6l-1-3.3 2.8-2Z" />
    <path d="M12 3.5v3.7M6.1 9.4l4.1 2.9M17.9 9.4l-4.1 2.9M9.3 15.4 7.6 19M14.7 15.4 16.4 19" />
  </svg>
);

const ExternalIcon = () => (
  <svg {...iconProps} className={styles.navIcon}>
    <path d="M14 5h5v5M18.5 5.5 11 13" />
    <path d="M18 14v3.5A2.5 2.5 0 0 1 15.5 20h-9A2.5 2.5 0 0 1 4 17.5v-9A2.5 2.5 0 0 1 6.5 6H10" />
  </svg>
);

const Header: React.FC = () => {
  const { user } = useAppSelector((state) => state.user);
  const location = useLocation();
  const displayName = user ? getUserDisplayName(user.name, user.nickname) : '';
  const initials = user ? getUserInitials(user.name, user.nickname) : '';
  const signInHref = `${AuthRoutesEnum.SignIn}?from=${encodeURIComponent(`${location.pathname}${location.search}`)}`;

  const navLinkClass = ({ isActive }: { isActive: boolean }) => cn(styles.navLink, { [styles.active]: isActive });

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to={RoutesEnum.Home} className={styles.brand}>
          <span className={styles.brandMark}>
            <BallIcon />
          </span>
          <span className={styles.brandName}>Footbet</span>
        </Link>

        <nav className={styles.nav}>
          <NavLink to={RoutesEnum.Home} end className={navLinkClass}>
            Головна
          </NavLink>
          <NavLink to={RoutesEnum.Rules} className={navLinkClass}>
            Правила
          </NavLink>
          {user?.role === 'admin' && (
            <a
              href={`${process.env.REACT_APP_API_URL}/admin/matches`}
              target="_blank"
              className={cn(styles.navLink, styles.navLinkExternal)}
              rel="noreferrer">
              Адмінка
              <ExternalIcon />
            </a>
          )}
        </nav>

        {user ? (
          <Link to={RoutesEnum.User} className={styles.user} title={displayName}>
            <span className={styles.userAvatar}>
              {user.avatar ? (
                <img src={resolveAssetUrl(user.avatar)} alt={displayName} />
              ) : (
                <span className={styles.userInitials}>{initials}</span>
              )}
            </span>
            <span className={styles.userText}>
              <span className={styles.userLabel}>Профіль</span>
              <span className={styles.userName}>{displayName}</span>
            </span>
          </Link>
        ) : (
          <Link to={signInHref} className={styles.signInButton}>
            Увійти
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
