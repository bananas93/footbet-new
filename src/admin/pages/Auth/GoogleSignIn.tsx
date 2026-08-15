import { FC, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';

interface Props {
  onSignIn: () => Promise<void>;
}

const GoogleSignIn: FC<Props> = ({ onSignIn }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await onSignIn();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: '#f5f7fb',
        p: 2,
      }}>
      <Paper elevation={2} sx={{ maxWidth: 420, width: '100%', p: 4 }}>
        <Typography variant="h5" fontWeight={700} mb={1}>
          Admin Login
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Увійдіть через Google, щоб відкрити панель адміністратора.
        </Typography>
        <Button fullWidth variant="contained" onClick={handleSignIn} disabled={isLoading}>
          {isLoading ? 'Переходимо до Google...' : 'Увійти через Google'}
        </Button>
      </Paper>
    </Box>
  );
};

export default GoogleSignIn;
