import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Layout from './components/Layout/Layout';
import { Routes as AdminRoutes } from './routes/Routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const AdminApp = () => (
  <QueryClientProvider client={queryClient}>
    <LocalizationProvider adapterLocale="uk" dateAdapter={AdapterDayjs}>
      <Layout>
        <AdminRoutes />
      </Layout>
    </LocalizationProvider>
  </QueryClientProvider>
);

export default AdminApp;
