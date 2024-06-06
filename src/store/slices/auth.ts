import { AxiosResponse } from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { IHttpRequestResult } from 'interfaces';
import {
  createExtraReducersForResponses,
  createHttpRequestInitResult,
  http,
  removeAccessToken,
  removeRefreshToken,
  saveAccessToken,
  saveRefreshToken,
} from 'helpers';

interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
}

interface ISignUpPayload {
  email: string;
  password: string;
  phone?: string;
  name: string;
}

export const signInUser = createAsyncThunk(
  'auth/signInUser',
  async ({ email, password }: { email: string; password: string }) => {
    const response: AxiosResponse<IAuthResponse> = await http.auth.post('/auth/login', { email, password });
    return response.data;
  },
);

export const signUpUser = createAsyncThunk('auth/signUpUser', async (data: ISignUpPayload) => {
  const response: AxiosResponse<IAuthResponse> = await http.auth.post('/auth/', data);
  return response.data;
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ email }: { email: string }) => {
  await http.auth.post('/auth/forgot-password', { email });
});

export const checkVerificationCode = createAsyncThunk(
  'auth/checkVerificationCode',
  async ({ email, code }: { email: string; code: string }) => {
    await http.auth.post('/auth/check-token', { email, code });
  },
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ email, password, code }: { email: string; password: string; code: string }) => {
    await http.auth.post('/auth/change-password', { email, password, code });
  },
);

interface IAuthState {
  signInUserRequest: IHttpRequestResult<IAuthResponse>;
  signUpUserRequest: IHttpRequestResult<IAuthResponse>;
  resetPasswordRequest: IHttpRequestResult<void>;
  checkVerificationCodeRequest: IHttpRequestResult<void>;
  changePasswordRequest: IHttpRequestResult<void>;
  isAuthenticated: boolean;
}

const initialState: IAuthState = {
  signInUserRequest: createHttpRequestInitResult(),
  signUpUserRequest: createHttpRequestInitResult(),
  resetPasswordRequest: createHttpRequestInitResult(),
  checkVerificationCodeRequest: createHttpRequestInitResult(),
  changePasswordRequest: createHttpRequestInitResult(),
  isAuthenticated: false,
};

export const AuthSlice = createSlice({
  name: 'Auth',
  initialState,
  reducers: {
    setIsAuthenticated: (state) => {
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      removeAccessToken();
      removeRefreshToken();
    },
  },
  extraReducers: (builder) => {
    createExtraReducersForResponses(builder, signInUser, 'signInUserRequest', async (state, action) => {
      state.isAuthenticated = true;
      const { accessToken, refreshToken } = action.payload;
      saveAccessToken(accessToken);
      saveRefreshToken(refreshToken);
    });
    createExtraReducersForResponses(builder, signUpUser, 'signUpUserRequest', (state, action) => {
      state.isAuthenticated = true;
    });
    createExtraReducersForResponses(builder, resetPassword, 'resetPasswordRequest');
    createExtraReducersForResponses(builder, checkVerificationCode, 'checkVerificationCodeRequest');
    createExtraReducersForResponses(builder, changePassword, 'changePasswordRequest');
  },
});

export const { setIsAuthenticated, logout } = AuthSlice.actions;

export default AuthSlice.reducer;
