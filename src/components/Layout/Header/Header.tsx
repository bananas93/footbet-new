import { Link } from 'react-router-dom';
import styles from './Header.module.scss';
import { useAppSelector } from 'store';
import { RoutesEnum } from 'routes/AppRoutes';
import { NavLink } from 'react-router-dom';
import { getUserDisplayName, getUserInitials, resolveAssetUrl } from 'helpers';

const Header: React.FC = () => {
  const { user } = useAppSelector((state) => state.user);
  const displayName = user ? getUserDisplayName(user.name, user.nickname) : '';
  const initials = user ? getUserInitials(user.name, user.nickname) : '';

  return (
    <header className={styles.header}>
      <nav className={styles.headerNav}>
        <NavLink to={RoutesEnum.Home} className={styles.headerNavLink}>
          Головна
        </NavLink>
        <NavLink to={RoutesEnum.Rules} className={styles.headerNavLink}>
          Правила
        </NavLink>
        {user?.role === 'admin' && (
          <a
            href={`${process.env.REACT_APP_API_URL}/admin/matches`}
            target="_blank"
            className={styles.headerNavLink}
            rel="noreferrer">
            Адмінка
          </a>
        )}
      </nav>
      {user && (
        <Link to={RoutesEnum.User} className={styles.headerUser}>
          <span className={styles.headerUserName}>{displayName}</span>
          <div className={styles.headerUserAvatar}>
            {user.avatar ? (
              <img src={resolveAssetUrl(user.avatar)} alt={displayName} />
            ) : (
              <span className={styles.headerUserAvatarName}>{initials}</span>
            )}
          </div>
        </Link>
      )}
    </header>
  );
};

export default Header;
