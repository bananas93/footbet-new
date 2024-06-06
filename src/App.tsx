import { Layout, LoginLayout } from 'components';
import { getAccessToken } from 'helpers';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { AppRoutes } from 'routes/AppRoutes';
import { AuthRoutes } from 'routes/AuthRoutes';
import { useAppDispatch, useAppSelector } from 'store';
import { logout, setIsAuthenticated } from 'store/slices/auth';
import 'react-toastify/dist/ReactToastify.css';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      if (token) {
        dispatch(setIsAuthenticated());
      } else {
        dispatch(logout());
      }
    };

    checkAuth().then(() => setIsLoading(false));
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
