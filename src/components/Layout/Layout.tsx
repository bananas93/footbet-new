import { useAppDispatch } from 'store';
import styles from './Layout.module.scss';
import { getTournaments } from 'store/slices/tournament';
import { getRooms } from 'store/slices/room';
import { useEffect, useState } from 'react';
import Header from './Header/Header';
import Button from 'components/Button/Button';
import { getUserProfile } from 'store/slices/user';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([dispatch(getTournaments()), dispatch(getUserProfile())]);
      setIsLoading(false);
    };

    fetchData();
  }, [dispatch]);

  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>{isLoading ? 'Loading...' : children}</main>
      <footer className={styles.footer}>
        <p className={styles.footerCopy}>
          Footbet.pp.ua &copy; {currentYear} Created by David Amerov |{' '}
          <Button variant="link" target="_blank" href="https://send.monobank.ua/jar/3xKBpcQqCk">
            Допомогти проєкту
          </Button>
        </p>
      </footer>
    </div>
  );
};

export default Layout;
