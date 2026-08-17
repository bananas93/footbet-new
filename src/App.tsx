import { CookieConsent, InstallBanner, Layout, LoginLayout, ProjectSupportPopup, Toast } from 'components';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoutes } from 'routes/AppRoutes';
import { AuthRoutes, AuthRoutesEnum } from 'routes/AuthRoutes';
import { useAppDispatch, useAppSelector } from 'store';
import { handleOAuthCallback, hydrateAuth, setIsAuthenticated } from 'store/slices/auth';
import { clearUser, getUserProfile } from 'store/slices/user';
import { ANALYTICS_CONSENT_EVENT, clearPushSubscription, initAnalytics, supabase, trackPageView } from 'helpers';
import { useI18n } from 'i18n';
import styles from './App.module.scss';
import 'react-toastify/dist/ReactToastify.css';

const AUTH_PATHS = new Set<string>([
  AuthRoutesEnum.SignIn,
  AuthRoutesEnum.SignUp,
  AuthRoutesEnum.ForgotPassword,
  AuthRoutesEnum.CheckCode,
  AuthRoutesEnum.SetPassword,
]);

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

const getRouteTitle = (pathname: string, t: (key: string, fallback?: string) => string): string => {
  if (pathname === '/') return t('app.routes.home');
  if (pathname === '/rules') return t('app.routes.rules');
  if (pathname === '/project-support') return t('app.routes.projectSupport');
  if (pathname === '/user') return t('app.routes.user');
  if (pathname === '/signin') return t('app.routes.signin');
  if (pathname === '/signup') return t('app.routes.signup');
  if (pathname === '/forgot-password') return t('app.routes.forgotPassword');
  if (pathname === '/check-code') return t('app.routes.checkCode');
  if (pathname === '/set-password') return t('app.routes.setPassword');
  if (pathname.startsWith('/tournament/')) return t('app.routes.tournament');
  if (pathname.startsWith('/profile/')) return t('app.routes.profile');
  return t('app.defaultTitle');
};

const App: React.FC = () => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname, search, state } = location;
  const { isAuthenticated } = useAppSelector((appState) => appState.auth);
  const isAuthPage = AUTH_PATHS.has(pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  useEffect(() => {
    document.title = getRouteTitle(pathname, t);
  }, [pathname, t]);

  useEffect(() => {
    initAnalytics();

    const handleConsentChange = () => {
      const pathWithQuery = `${window.location.pathname}${window.location.search}`;
      initAnalytics();
      trackPageView(pathWithQuery);
    };

    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChange);

    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChange);
    };
  }, []);

  useEffect(() => {
    trackPageView(`${pathname}${search}`);
  }, [pathname, search]);

  useEffect(() => {
    if (!isAuthPage) {
      sessionStorage.setItem('last-public-route', `${pathname}${search}` || '/');
    }
  }, [isAuthPage, pathname, search]);

  useEffect(() => {
    if (isAuthenticated || pathname !== AuthRoutesEnum.SignIn) {
      return;
    }

    const hasFromQuery = new URLSearchParams(search).has('from');
    const navState = (state || {}) as { from?: string; authIntent?: boolean };
    const hasIntentState = !!navState.from || !!navState.authIntent;

    if (hasFromQuery || hasIntentState) {
      return;
    }

    const fallbackRoute = sessionStorage.getItem('last-public-route') || '/';
    navigate(fallbackRoute, { replace: true });
  }, [isAuthenticated, navigate, pathname, search, state]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        await dispatch(handleOAuthCallback()).unwrap();
      } catch {
        // Silent here; user-facing errors are shown where auth action was initiated.
      }

      try {
        const result = await dispatch(hydrateAuth()).unwrap();
        if (result.isAuthenticated) {
          await dispatch(getUserProfile(true));
        } else {
          void clearPushSubscription();
          dispatch(clearUser());
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrapAuth();

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthenticatedNow = !!session;
      dispatch(setIsAuthenticated(isAuthenticatedNow));

      if (isAuthenticatedNow) {
        dispatch(getUserProfile(true));
      } else {
        void clearPushSubscription();
        dispatch(clearUser());
      }
    });

    return () => {
      isMounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className={styles.boot}>
        <div className={styles.bootCard}>
          <div className={styles.bootBrand}>
            <span className={styles.bootMark} aria-hidden>
              <BallIcon className={styles.bootMarkIcon} />
            </span>
            <span className={styles.bootTitle}>Footbet</span>
          </div>
          <div className={styles.loader} aria-hidden>
            <span className={styles.loaderDot} />
            <span className={styles.loaderDot} />
            <span className={styles.loaderDot} />
          </div>
          <p className={styles.bootText}>{t('app.boot.loading')}</p>
        </div>
      </div>
    );
  }

  if (pathname.startsWith('/admin')) {
    return (
      <>
        <AppRoutes />
        <Toast position="top-center" />
      </>
    );
  }

  if (isAuthPage) {
    return (
      <>
        <LoginLayout>
          <AuthRoutes />
          <Toast />
        </LoginLayout>
        <InstallBanner />
        <CookieConsent />
        <ProjectSupportPopup />
      </>
    );
  }

  return (
    <>
      <Layout>
        <AppRoutes />
        <Toast position="top-center" />
      </Layout>
      <InstallBanner />
      <CookieConsent />
      <ProjectSupportPopup />
    </>
  );
};

export default App;
