import { CookieConsent, InstallBanner, Layout, LoginLayout, Toast } from 'components';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppRoutes } from 'routes/AppRoutes';
import { AuthRoutes } from 'routes/AuthRoutes';
import { useAppDispatch, useAppSelector } from 'store';
import { handleOAuthCallback, hydrateAuth, setIsAuthenticated } from 'store/slices/auth';
import { clearUser, getUserProfile } from 'store/slices/user';
import { clearPushSubscription, supabase } from 'helpers';
import 'react-toastify/dist/ReactToastify.css';

const DEFAULT_TITLE = 'Турнір прогнозистів | Footbet';

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
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  useEffect(() => {
    document.title = getRouteTitle(pathname);
  }, [pathname]);

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

  if (isAuthenticated) {
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
  }
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
};

export default App;
