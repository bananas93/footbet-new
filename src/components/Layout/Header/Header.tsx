import { Link } from 'react-router-dom';
import styles from './Header.module.scss';
import { useAppSelector } from 'store';
import { RoutesEnum } from 'routes/AppRoutes';
import { NavLink } from 'react-router-dom';

const Header: React.FC = () => {
  const { user } = useAppSelector((state) => state.user);

  return (
    <header className={styles.header}>
      <nav className={styles.headerNav}>
        <NavLink to={RoutesEnum.Home} className={styles.headerNavLink}>
          Головна
        </NavLink>
        <NavLink to={RoutesEnum.Rules} className={styles.headerNavLink}>
          Правила
        </NavLink>
      </nav>
      {user && (
        <Link to={RoutesEnum.User} className={styles.headerUser}>
          <span className={styles.headerUserName}>{user.nickname || user.name}</span>
          <div className={styles.headerUserAvatar}>
            {user.avatar ? (
              <img src={`${process.env.REACT_APP_UPLOAD_URL}/${user.avatar}`} alt={user.name} />
            ) : (
              <span className={styles.headerUserAvatarName}>
                {user?.name[0]}
                {user?.name[1]}
              </span>
            )}
          </div>
        </Link>
      )}
    </header>
  );
};

export default Header;
