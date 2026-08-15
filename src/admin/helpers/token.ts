export const saveTokens = async (accessToken: string, refreshToken?: string) => {
  try {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
};

export const getTokens = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
};
