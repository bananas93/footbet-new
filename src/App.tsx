import { CookieConsent, InstallBanner, Layout, LoginLayout, Toast } from 'components';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoutes } from 'routes/AppRoutes';
import { AuthRoutes, AuthRoutesEnum } from 'routes/AuthRoutes';
import { useAppDispatch, useAppSelector } from 'store';
import { handleOAuthCallback, hydrateAuth, setIsAuthenticated } from 'store/slices/auth';
import { clearUser, getUserProfile } from 'store/slices/user';
import { clearPushSubscription, supabase } from 'helpers';
import 'react-toastify/dist/ReactToastify.css';

const DEFAULT_TITLE = 'Турнір прогнозистів | Footbet';
const AUTH_PATHS = new Set<string>([
  AuthRoutesEnum.SignIn,
  AuthRoutesEnum.SignUp,
  AuthRoutesEnum.ForgotPassword,
  AuthRoutesEnum.CheckCode,
  AuthRoutesEnum.SetPassword,
]);

const getRouteTitle = (pathname: string): string => {
  if (pathname === '/') return 'Головна | Footbet';
  if (pathname === '/rules') return 'Правила | Footbet';
  if (pathname === '/user') return 'Профіль | Footbet';
  if (pathname === '/signin') return 'Вхід | Footbet';
  if (pathname === '/signup') return 'Реєстрація | Footbet';
  if (pathname === '/forgot-password') return 'Відновлення пароля | Footbet';
  if (pathname === '/check-code') return 'Код підтвердження | Footbet';
  if (pathname === '/set-password') return 'Новий пароль | Footbet';
  if (pathname.startsWith('/tournament/')) return 'Турнір | Footbet';
  if (pathname.startsWith('/profile/')) return 'Профіль користувача | Footbet';
  return DEFAULT_TITLE;
};

const App: React.FC = () => {
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
    document.title = getRouteTitle(pathname);
  }, [pathname]);

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
    return <div>Loading...</div>;
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
    </>
  );
};

export default App;
