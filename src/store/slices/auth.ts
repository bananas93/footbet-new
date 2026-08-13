import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { IHttpRequestResult } from 'interfaces';
import { createExtraReducersForResponses, createHttpRequestInitResult, supabase } from 'helpers';

interface IAuthResponse {
  userId: string;
  email: string;
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Не вдалося авторизуватися');
    }

    return {
      userId: data.user.id,
      email: data.user.email || email,
    } as IAuthResponse;
  },
);

export const signUpUser = createAsyncThunk('auth/signUpUser', async (data: ISignUpPayload) => {
  const { data: response, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        phone: data.phone,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!response.user) {
    throw new Error('Не вдалося зареєструвати користувача');
  }

  return {
    userId: response.user.id,
    email: response.user.email || data.email,
  } as IAuthResponse;
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ email }: { email: string }) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/set-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
});

export const checkVerificationCode = createAsyncThunk(
  'auth/checkVerificationCode',
  async ({ code }: { email: string; code: string }) => {
    // Supabase password recovery validates via recovery link token, not manual OTP from API.
    if (!code) {
      throw new Error('Код підтвердження не вказано');
    }
  },
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ password }: { password: string }) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw new Error(error.message);
    }
  },
);

export const hydrateAuth = createAsyncThunk('auth/hydrateAuth', async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }

  const session = data.session;
  return {
    isAuthenticated: !!session,
  };
});

export const signInWithGoogle = createAsyncThunk('auth/signInWithGoogle', async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/signin`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
});

export const handleOAuthCallback = createAsyncThunk('auth/handleOAuthCallback', async () => {
  const currentUrl = new URL(window.location.href);
  const code = currentUrl.searchParams.get('code');
  const errorDescription = currentUrl.searchParams.get('error_description');

  if (errorDescription) {
    throw new Error(errorDescription);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw new Error(error.message);
    }

    // Keep URL clean after exchanging OAuth code.
    currentUrl.searchParams.delete('code');
    currentUrl.searchParams.delete('state');
    window.history.replaceState({}, '', currentUrl.pathname + currentUrl.search);
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }

  return {
    isAuthenticated: !!data.session,
  };
});

export const signOutUser = createAsyncThunk('auth/signOutUser', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
  return null;
});

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
    setIsAuthenticated: (state, action: { payload: boolean }) => {
      state.isAuthenticated = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    createExtraReducersForResponses(builder, signInUser, 'signInUserRequest', (state) => {
      state.isAuthenticated = true;
    });
    createExtraReducersForResponses(builder, signUpUser, 'signUpUserRequest', (state) => {
      state.isAuthenticated = false;
    });
    createExtraReducersForResponses(builder, resetPassword, 'resetPasswordRequest');
    createExtraReducersForResponses(builder, checkVerificationCode, 'checkVerificationCodeRequest');
    createExtraReducersForResponses(builder, changePassword, 'changePasswordRequest');

    builder.addCase(hydrateAuth.fulfilled, (state, action) => {
      state.isAuthenticated = action.payload.isAuthenticated;
    });
    builder.addCase(hydrateAuth.rejected, (state) => {
      state.isAuthenticated = false;
    });

    builder.addCase(signInWithGoogle.rejected, (state, action) => {
      state.signInUserRequest.isError = true;
      state.signInUserRequest.error = action.error;
    });

    builder.addCase(handleOAuthCallback.fulfilled, (state, action) => {
      state.isAuthenticated = action.payload.isAuthenticated;
    });
    builder.addCase(handleOAuthCallback.rejected, (state) => {
      state.isAuthenticated = false;
    });

    builder.addCase(signOutUser.fulfilled, (state) => {
      state.isAuthenticated = false;
    });
  },
});

export const { setIsAuthenticated, logout } = AuthSlice.actions;

export default AuthSlice.reducer;
