import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch } from 'store';
import { getTournaments } from 'store/slices/tournament';
import { RoutesEnum } from 'routes/AppRoutes';
import Header from './Header/Header';
import { getUserProfile } from 'store/slices/user';
import styles from './Layout.module.scss';

interface LayoutProps {
  children: React.ReactNode;
}

const iconProps = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const BallIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2l2.8 2-1 3.3h-3.6l-1-3.3 2.8-2Z" />
    <path d="M12 3.5v3.7M6.1 9.4l4.1 2.9M17.9 9.4l-4.1 2.9M9.3 15.4 7.6 19M14.7 15.4 16.4 19" />
  </svg>
);

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M8 4h8v5.2a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5.5H5.6A1.6 1.6 0 0 0 4 7.1v.6a3.8 3.8 0 0 0 3.8 3.8H8" />
    <path d="M16 5.5h2.4A1.6 1.6 0 0 1 20 7.1v.6a3.8 3.8 0 0 1-3.8 3.8H16" />
    <path d="M12 13.2V16" />
    <path d="M9.6 20h4.8l-.6-3h-3.6L9.6 20Z" />
    <path d="M8.4 20h7.2" />
  </svg>
);

const ChartIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M4 19.5h16" />
    <path d="M7 19.5v-6M12 19.5V7M17 19.5v-9" />
  </svg>
);

const TargetIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.6" />
  </svg>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([dispatch(getTournaments()), dispatch(getUserProfile(false))]);
    };

    fetchData();
  }, [dispatch]);

  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <div className={styles.footerGlow} aria-hidden />
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <span className={styles.footerBrandMark}>
                <BallIcon className={styles.footerBrandIcon} />
              </span>
              <div className={styles.footerBrandText}>
                <p className={styles.footerTitle}>Footbet</p>
                <p className={styles.footerSubtitle}>Твій простір для прогнозів та турнірної аналітики</p>
              </div>
            </div>

            <div className={styles.footerChips}>
              <span className={styles.footerChip}>
                <TargetIcon className={styles.footerChipIcon} />
                Прогнози
              </span>
              <span className={styles.footerChip}>
                <TrophyIcon className={styles.footerChipIcon} />
                Турніри
              </span>
              <span className={styles.footerChip}>
                <ChartIcon className={styles.footerChipIcon} />
                Аналітика
              </span>
            </div>

            <nav className={styles.footerNav} aria-label="Футер">
              <Link to={RoutesEnum.Home} className={styles.footerLink}>
                Головна
              </Link>
              <Link to={RoutesEnum.Rules} className={styles.footerLink}>
                Правила
              </Link>
              <Link to={RoutesEnum.User} className={styles.footerLink}>
                Профіль
              </Link>
            </nav>
          </div>

          <div className={styles.footerDivider} aria-hidden />

          <div className={styles.footerMeta}>
            <p className={styles.footerCopy}>Footbet.pp.ua &copy; {currentYear}</p>
            <p className={styles.footerNote}>Створено для фанів футболу</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
