/* eslint-disable no-async-promise-executor */
import axios, { AxiosInstance } from 'axios';
import { getTokens, saveTokens } from './token';

export const instance: AxiosInstance = axios.create({
  baseURL: `${process.env.REACT_APP_PUBLIC_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

class CustomError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

const handleHttpError = (error: any) => {
  const message =
    typeof error.response?.data?.error === 'string' ? error.response.data.error : 'Something Failed. Try again?';
  const newError = new CustomError(message, `${error.response?.status}`);
  return newError;
};

export const getRefreshToken = async () => {
  try {
    const tokens = await getTokens();
    const token = tokens.refreshToken;
    const { data } = await instance.post('auth/refresh', { refreshToken: token });
    const { accessToken, refreshToken } = data;
    await saveTokens(accessToken, refreshToken);
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

instance.interceptors.request.use(
  async (config) => {
    const tokens = await getTokens();
    const authToken = tokens.accessToken;
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${authToken}`;
    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  async (response) => response,
  async (err) => {
    const originalConfig: any = err.config;
    const tokens = await getTokens();
    const refreshToken = tokens?.refreshToken;
    if (err.response.status === 401 && !originalConfig._retry && refreshToken) {
      try {
        await getRefreshToken();
        return instance(originalConfig);
      } catch (error: any) {
        if (error?.response?.status === 400) {
          console.log(error?.response?.data || error?.message);
        }
        return Promise.reject(err);
      }
    }
    return Promise.reject(handleHttpError(err));
  },
);
