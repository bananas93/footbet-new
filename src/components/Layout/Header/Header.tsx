import { Link } from 'react-router-dom';
import styles from './Header.module.scss';

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <h1>Footbet</h1>
      <nav className={styles.headerNav}>
        <ul className={styles.headerNavList}>
          <li className={styles.headerNavListItem}>
            <Link to="/" className={styles.headerNavListLink}>
              Головна
            </Link>
          </li>
          <li className={styles.headerNavListItem}>
            <Link to="/tournament" className={styles.headerNavListLink}>
              Турніри
            </Link>
          </li>
          <li className={styles.headerNavListItem}>
            <Link to="/rooms" className={styles.headerNavListLink}>
              Ліги
            </Link>
          </li>
          <li className={styles.headerNavListItem}>
            <Link to="/rules" className={styles.headerNavListLink}>
              Правила
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
