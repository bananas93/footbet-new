import { CookieConsent, InstallBanner, Layout, LoginLayout, ProjectSupportPopup, Toast } from 'components';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoutes } from 'routes/AppRoutes';
import { AuthRoutes, AuthRoutesEnum } from 'routes/AuthRoutes';
import { useAppDispatch, useAppSelector } from 'store';
import { handleOAuthCallback, hydrateAuth, setIsAuthenticated } from 'store/slices/auth';
import { clearUser, getUserProfile } from 'store/slices/user';
import { ANALYTICS_CONSENT_EVENT, clearPushSubscription, initAnalytics, supabase, trackPageView } from 'helpers';
import { useI18n } from 'i18n';
import 'react-toastify/dist/ReactToastify.css';

const AUTH_PATHS = new Set<string>([
  AuthRoutesEnum.SignIn,
  AuthRoutesEnum.SignUp,
  AuthRoutesEnum.ForgotPassword,
  AuthRoutesEnum.CheckCode,
  AuthRoutesEnum.SetPassword,
]);

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
    const bootstrapAuth = async () => {
      try {
        await dispatch(handleOAuthCallback()).unwrap();
      } catch {
        // Silent here; user-facing errors are shown where auth action was initiated.
      }

      const result = await dispatch(hydrateAuth()).unwrap();
      if (result.isAuthenticated) {
        await dispatch(getUserProfile(true));
      } else {
        void clearPushSubscription();
        dispatch(clearUser());
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
      authSubscription.subscription.unsubscribe();
    };
  }, [dispatch]);

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
