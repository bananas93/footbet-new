import styles from './LoginLayout.module.scss';
import LoginImg from 'assets/img/login.avif';

interface LoginLayoutProps {
  children: React.ReactNode;
}

const LoginLayout: React.FC<LoginLayoutProps> = ({ children }) => {
  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.imgCol}>
          <img className={styles.img} src={LoginImg} alt="logo" />
        </div>
        <div className={styles.contentCol}>{children}</div>
      </div>
    </div>
  );
};

export default LoginLayout;
