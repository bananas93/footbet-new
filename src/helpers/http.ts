import { ActionReducerMapBuilder, AsyncThunk, PayloadAction, SerializedError } from '@reduxjs/toolkit';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getAccessToken, getRefreshToken, saveAccessToken, saveRefreshToken } from './tokens';

export const instance: AxiosInstance = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authInstance: AxiosInstance = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  async (config) => {
    const accessToken = getAccessToken();
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error),
);

export const refreshAccessToken = async (token: string) => {
  try {
    const { data } = await instance.post('auth/refresh', { refreshToken: token });
    const { accessToken, refreshToken } = data;
    saveAccessToken(accessToken);
    saveRefreshToken(refreshToken);
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

instance.interceptors.response.use(
  async (response) => response,
  async (err) => {
    const originalConfig: any = err.config;
    const refreshToken = getRefreshToken();
    if (err.response.status === 401 && !originalConfig._retry && refreshToken) {
      try {
        await refreshAccessToken(refreshToken);
        return instance(originalConfig);
      } catch (error: any) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  },
);

authInstance.interceptors.request.use(
  async (config) => config,
  (error) => Promise.reject(error),
);

authInstance.interceptors.response.use(
  async (response) => response,
  async (err) => Promise.reject(err),
);

const handleHttpError = (error: any) => {
  const message =
    typeof error.response?.data?.error === 'string' ? error.response.data.error : 'Something Failed. Try again?';
  const newError: SerializedError = new Error(message);
  newError.code = `${error.response?.status}`;
  return newError;
};

const makeHttpRequest = (apiCall: () => Promise<AxiosResponse>) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response: AxiosResponse = await apiCall();
      resolve(response);
    } catch (e: any) {
      reject(handleHttpError(e));
    }
  });
};

export const http = {
  auth: {
    get: (url: string, options?: any): Promise<any> => makeHttpRequest(() => authInstance.get(url, options)),
    post: (url: string, data?: any, options?: any): Promise<any> =>
      makeHttpRequest(() => authInstance.post(url, data, options)),
    put: (url: string, data?: any, options?: any): Promise<any> =>
      makeHttpRequest(() => authInstance.put(url, data, options)),
    patch: (url: string, data?: any, options?: any): Promise<any> =>
      makeHttpRequest(() => authInstance.patch(url, data, options)),
    delete: (url: string, options?: any): Promise<any> => makeHttpRequest(() => authInstance.delete(url, options)),
  },
  api: {
    get: (url: string, options?: any): Promise<any> => makeHttpRequest(() => instance.get(url, options)),
    post: (url: string, data?: any, options?: any): Promise<any> =>
      makeHttpRequest(() => instance.post(url, data, options)),
    put: (url: string, data?: any, options?: any): Promise<any> =>
      makeHttpRequest(() => instance.put(url, data, options)),
    patch: (url: string, data?: any, options?: any): Promise<any> =>
      makeHttpRequest(() => instance.patch(url, data, options)),
    delete: (url: string, options?: any): Promise<any> => makeHttpRequest(() => instance.delete(url, options)),
  },
};

export const createHttpRequestInitResult = () => ({
  data: undefined,
  error: undefined,
  isUninitialized: false,
  isLoading: false,
  isSuccess: false,
  isError: false,
});

export const createExtraReducersForResponses = <TState>(
  builder: ActionReducerMapBuilder<TState>,
  asyncThunk: AsyncThunk<any, any, any>,
  reduxField: string,
  successCallback?: (state: TState, action: PayloadAction<any, string, any, never>) => void,
) => {
  builder.addCase(asyncThunk.pending, (state: any, action) => {
    state[reduxField].error = undefined;
    state[reduxField].isError = false;
    state[reduxField].isSuccess = false;
    if (!action.meta.arg?._background) {
      state[reduxField].isLoading = true;
    }
  });
  builder.addCase(asyncThunk.fulfilled, (state: any, action: PayloadAction<any, string, any, never>) => {
    state[reduxField].isUninitialized = false;
    state[reduxField].isSuccess = true;
    state[reduxField].data = action.payload;
    state[reduxField].isLoading = false;
    if (successCallback) {
      successCallback(state as TState, action);
    }
  });
  builder.addCase(asyncThunk.rejected, (state: any, action: PayloadAction<any, string, any, any>) => {
    state[reduxField].isUninitialized = false;
    state[reduxField].data = undefined;
    state[reduxField].isLoading = false;
    state[reduxField].isError = true;
    state[reduxField].error = action.error;
  });
};
