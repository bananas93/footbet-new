import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'store';
import { getTournaments } from 'store/slices/tournament';
import { RoutesEnum } from 'routes/AppRoutes';
import Header from './Header/Header';
import { getUserProfile } from 'store/slices/user';
import styles from './Layout.module.scss';
import { useI18n } from 'i18n';

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

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const tournaments = useAppSelector((state) => state.tournament.tournaments);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!tournaments.length) {
      dispatch(getTournaments());
    }
  }, [dispatch, tournaments.length]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    dispatch(getUserProfile(false));
  }, [dispatch, isAuthenticated]);

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
                <p className={styles.footerSubtitle}>{t('layout.footer.subtitle')}</p>
              </div>
            </div>

            <nav className={styles.footerNav} aria-label={t('layout.footer.navLabel')}>
              <Link to={RoutesEnum.Home} className={styles.footerLink}>
                {t('layout.footer.home')}
              </Link>
              <Link to={RoutesEnum.Rules} className={styles.footerLink}>
                {t('layout.footer.rules')}
              </Link>
              <Link to={RoutesEnum.ProjectSupport} className={styles.footerLink}>
                {t('layout.footer.support')}
              </Link>
            </nav>
          </div>

          <div className={styles.footerDivider} aria-hidden />

          <div className={styles.footerMeta}>
            <p className={styles.footerCopy}>Footbet.pp.ua &copy; {currentYear}</p>
            <p className={styles.footerNote}>{t('layout.footer.note')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
