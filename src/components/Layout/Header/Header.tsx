import { Link } from 'react-router-dom';
import styles from './Header.module.scss';
import { useAppSelector } from 'store';
import Button from 'components/Button/Button';
import { RoutesEnum } from 'routes/AppRoutes';

const Header: React.FC = () => {
  const { user } = useAppSelector((state) => state.user);

  return (
    <header className={styles.header}>
      <h1>
        <Button variant="link" href="/">
          Footbet
        </Button>
      </h1>
      {user && (
        <Link to={RoutesEnum.User} className={styles.headerUser}>
          <span className={styles.headerUserName}>{user.nickname || user.name}</span>
          <div className={styles.headerUserAvatar}>
            {user.avatar ? (
              <img src={`http://localhost:3000/uploads/${user.avatar}`} alt={user.name} />
            ) : (
              <span className={styles.headerUserAvatarName}>
                {user.name[0]}
                {user.name[1]}
              </span>
            )}
          </div>
        </Link>
      )}
    </header>
  );
};

export default Header;
