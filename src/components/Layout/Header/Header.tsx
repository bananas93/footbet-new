import cn from 'classnames';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAppSelector } from 'store';
import { RoutesEnum } from 'routes/AppRoutes';
import { AuthRoutesEnum } from 'routes/AuthRoutes';
import { getUserDisplayName, getUserInitials, resolveAssetUrl } from 'helpers';
import styles from './Header.module.scss';
import { addLangPrefix, Lang, useI18n } from 'i18n';

const iconProps = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const BallIcon = () => (
  <svg {...iconProps} className={styles.brandIcon}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2l2.8 2-1 3.3h-3.6l-1-3.3 2.8-2Z" />
    <path d="M12 3.5v3.7M6.1 9.4l4.1 2.9M17.9 9.4l-4.1 2.9M9.3 15.4 7.6 19M14.7 15.4 16.4 19" />
  </svg>
);

const Header: React.FC = () => {
  const { t, lang } = useI18n();
  const { user } = useAppSelector((state) => state.user);
  const location = useLocation();
  const displayName = user ? getUserDisplayName(user.name, user.nickname) : '';
  const initials = user ? getUserInitials(user.name, user.nickname) : '';
  const signInHref = `${AuthRoutesEnum.SignIn}?from=${encodeURIComponent(`${location.pathname}${location.search}`)}`;

  const navLinkClass = ({ isActive }: { isActive: boolean }) => cn(styles.navLink, { [styles.active]: isActive });

  const switchLanguage = (nextLang: Lang) => {
    if (nextLang === lang) {
      return;
    }

    const nextPath = addLangPrefix(location.pathname, nextLang);
    window.location.assign(`${nextPath}${location.search}${location.hash}`);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to={RoutesEnum.Home} className={styles.brand}>
          <span className={styles.brandMark}>
            <BallIcon />
          </span>
          <span className={styles.brandName}>Footbet</span>
        </Link>

        <nav className={styles.nav}>
          <NavLink to={RoutesEnum.Home} end className={navLinkClass}>
            {t('layout.header.home')}
          </NavLink>
          <NavLink to={RoutesEnum.Rules} className={navLinkClass}>
            {t('layout.header.rules')}
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navLinkClass}>
              {t('layout.header.admin')}
            </NavLink>
          )}
        </nav>

        <div className={styles.actions}>
          <div className={styles.langSwitcher} role="group" aria-label={t('layout.header.language')}>
            <button
              type="button"
              className={cn(styles.langButton, { [styles.langButtonActive]: lang === 'ua' })}
              onClick={() => switchLanguage('ua')}
              aria-pressed={lang === 'ua'}>
              {t('layout.header.langUa')}
            </button>
            <button
              type="button"
              className={cn(styles.langButton, { [styles.langButtonActive]: lang === 'en' })}
              onClick={() => switchLanguage('en')}
              aria-pressed={lang === 'en'}>
              {t('layout.header.langEn')}
            </button>
          </div>

          {user ? (
            <Link to={RoutesEnum.User} className={styles.user} title={displayName}>
              <span className={styles.userAvatar}>
                {user.avatar ? (
                  <img src={resolveAssetUrl(user.avatar)} alt={displayName} />
                ) : (
                  <span className={styles.userInitials}>{initials}</span>
                )}
              </span>
              <span className={styles.userText}>
                <span className={styles.userLabel}>{t('layout.header.profile')}</span>
                <span className={styles.userName}>{displayName}</span>
              </span>
            </Link>
          ) : (
            <Link to={signInHref} className={styles.signInButton}>
              {t('layout.header.signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
