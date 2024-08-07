import { useAppDispatch } from 'store';
import styles from './Layout.module.scss';
import { getTournaments } from 'store/slices/tournament';
import { useEffect } from 'react';
import Header from './Header/Header';
import Button from 'components/Button/Button';
import { getUserProfile } from 'store/slices/user';
import socket from 'socket';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([dispatch(getTournaments()), dispatch(getUserProfile(false))]);
    };

    fetchData();
  }, [dispatch]);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>{children}</main>
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
