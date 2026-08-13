import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { IUser, IHttpRequestResult } from 'interfaces';
import { createExtraReducersForResponses, createHttpRequestInitResult, supabase } from 'helpers';

interface IChangeUserPasswordData {
  oldPassword: string;
  password: string;
}

export const getUserProfile = createAsyncThunk('user/getUserProfile', async (_background: boolean = false) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error('Користувач не авторизований');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, phone, name, nickname, avatar, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile) {
    const fallbackName =
      (user.user_metadata?.name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined) ||
      (user.email ? user.email.split('@')[0] : 'User');

    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email || null,
      name: fallbackName,
      phone: (user.user_metadata?.phone as string | undefined) || null,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    const { data: createdProfile, error: createdProfileError } = await supabase
      .from('profiles')
      .select('id, email, phone, name, nickname, avatar, role')
      .eq('id', user.id)
      .single();

    if (createdProfileError) {
      throw new Error(createdProfileError.message);
    }

    return {
      id: createdProfile.id,
      email: createdProfile.email || user.email || '',
      phone: createdProfile.phone || '',
      name: createdProfile.name,
      nickname: createdProfile.nickname || '',
      avatar: createdProfile.avatar || '',
      role: createdProfile.role,
    } as IUser;
  }

  return {
    id: profile.id,
    email: profile.email || user.email || '',
    phone: profile.phone || '',
    name: profile.name,
    nickname: profile.nickname || '',
    avatar: profile.avatar || '',
    role: profile.role,
  } as IUser;
});

export const editUserProfile = createAsyncThunk('user/editUserProfile', async (data: Partial<IUser>, thunkAPI) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error('Користувач не авторизований');
  }

  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update({
      name: data.name,
      phone: data.phone,
      nickname: data.nickname,
      avatar: data.avatar,
    })
    .eq('id', user.id)
    .select('id, email, phone, name, nickname, avatar, role')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await thunkAPI.dispatch(getUserProfile(true));
  return {
    id: updatedProfile.id,
    email: updatedProfile.email || user.email || '',
    phone: updatedProfile.phone || '',
    name: updatedProfile.name,
    nickname: updatedProfile.nickname || '',
    avatar: updatedProfile.avatar || '',
    role: updatedProfile.role,
  } as IUser;
});

export const changeUserPassword = createAsyncThunk('user/changeUserPassword', async (data: IChangeUserPasswordData) => {
  const { error } = await supabase.auth.updateUser({ password: data.password });
  if (error) {
    throw new Error(error.message);
  }
});

interface IUserState {
  user: IUser | null;
  onlyLiveMatches: boolean;
  getUserProfileRequest: IHttpRequestResult<IUser>;
  editUserProfileRequest: IHttpRequestResult<IUser>;
  changeUserPasswordRequest: IHttpRequestResult<void>;
}

const initialState: IUserState = {
  user: null,
  onlyLiveMatches: localStorage.getItem('onlyLiveMatches') === '1',
  getUserProfileRequest: createHttpRequestInitResult(),
  editUserProfileRequest: createHttpRequestInitResult(),
  changeUserPasswordRequest: createHttpRequestInitResult(),
};

export const UserSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    toggleOnlyLiveMatches: (state) => {
      state.onlyLiveMatches = !state.onlyLiveMatches;
      localStorage.setItem('onlyLiveMatches', state.onlyLiveMatches ? '1' : '0');
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    createExtraReducersForResponses(builder, getUserProfile, 'getUserProfileRequest', (state, action) => {
      state.user = action.payload;
    });
    createExtraReducersForResponses(builder, editUserProfile, 'editUserProfileRequest');
    createExtraReducersForResponses(builder, changeUserPassword, 'changeUserPasswordRequest');
  },
});

export const { toggleOnlyLiveMatches } = UserSlice.actions;
export const { clearUser } = UserSlice.actions;

export default UserSlice.reducer;
