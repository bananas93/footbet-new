import { Layout, LoginLayout } from 'components';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { AppRoutes } from 'routes/AppRoutes';
import { AuthRoutes } from 'routes/AuthRoutes';
import { useAppDispatch, useAppSelector } from 'store';
import { handleOAuthCallback, hydrateAuth, setIsAuthenticated } from 'store/slices/auth';
import { clearUser, getUserProfile } from 'store/slices/user';
import { supabase } from 'helpers';
import 'react-toastify/dist/ReactToastify.css';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

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
      <Layout>
        <AppRoutes />
        <ToastContainer hideProgressBar />
      </Layout>
    );
  }
  return (
    <LoginLayout>
      <AuthRoutes />
      <ToastContainer hideProgressBar />
    </LoginLayout>
  );
};

export default App;
