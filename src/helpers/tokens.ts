export const saveAccessToken = (token: string) => {
  localStorage.setItem('accessToken', token);
};

export const saveRefreshToken = (token: string) => {
  localStorage.setItem('refreshToken', token);
};

export const getAccessToken = () => {
  return localStorage.getItem('accessToken') || '';
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken') || '';
};

export const removeAccessToken = () => {
  localStorage.removeItem('accessToken');
};

export const removeRefreshToken = () => {
  localStorage.removeItem('refreshToken');
};
