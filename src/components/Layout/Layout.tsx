import { useAppDispatch } from 'store';
import styles from './Layout.module.scss';
import { getTournaments } from 'store/slices/tournament';
import { getRooms } from 'store/slices/room';
import { useEffect, useState } from 'react';
import Header from './Header/Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([dispatch(getTournaments()), dispatch(getRooms())]);
      setIsLoading(false);
    };

    fetchData();
  }, [dispatch]);

  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>{isLoading ? 'Loading...' : children}</main>
      <footer className={styles.footer}>
        <p className={styles.footerCopy}>&copy; {currentYear} Football Prediction Website. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
