import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { IUser, IHttpRequestResult } from 'interfaces';
import { createExtraReducersForResponses, createHttpRequestInitResult, supabase } from 'helpers';
import { translate } from 'i18n';

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
    throw new Error(translate('errors.user.notAuthorized'));
  }

  const authProvider =
    (user.app_metadata?.provider as string | undefined) ||
    (Array.isArray(user.identities) && user.identities[0]?.provider) ||
    'email';

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
      authProvider,
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
    authProvider,
  } as IUser;
});

export const editUserProfile = createAsyncThunk(
  'user/editUserProfile',
  async (data: Partial<IUser> & { avatarFile?: File | null }, thunkAPI) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw new Error(authError.message);
    }

    if (!user) {
      throw new Error(translate('errors.user.notAuthorized'));
    }

    let avatar = data.avatar;
    if (data.avatarFile instanceof File && data.avatarFile.size > 0) {
      const ext = data.avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'jpg';
      const filePath = `avatars/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, data.avatarFile, { upsert: true, contentType: data.avatarFile.type || 'image/jpeg' });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(filePath);
      avatar = publicUrlData.publicUrl;
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        name: data.name,
        phone: data.phone,
        nickname: data.nickname,
        avatar,
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
  },
);

export const changeUserPassword = createAsyncThunk('user/changeUserPassword', async (data: IChangeUserPasswordData) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error(translate('errors.user.notAuthorized'));
  }

  const authProvider =
    (user.app_metadata?.provider as string | undefined) ||
    (Array.isArray(user.identities) && user.identities[0]?.provider) ||
    'email';

  if (authProvider === 'google') {
    throw new Error(translate('errors.user.googlePasswordDisabled'));
  }

  const { error } = await supabase.auth.updateUser({ password: data.password });
  if (error) {
    throw new Error(error.message);
  }
});

export const deleteUserAccount = createAsyncThunk('user/deleteUserAccount', async () => {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) {
    throw new Error(error.message);
  }
});

interface IUserState {
  user: IUser | null;
  onlyLiveMatches: boolean;
  onlyScheduledMatches: boolean;
  getUserProfileRequest: IHttpRequestResult<IUser>;
  editUserProfileRequest: IHttpRequestResult<IUser>;
  changeUserPasswordRequest: IHttpRequestResult<void>;
  deleteUserAccountRequest: IHttpRequestResult<void>;
}

const initialState: IUserState = {
  user: null,
  onlyLiveMatches: localStorage.getItem('onlyLiveMatches') === '1',
  onlyScheduledMatches: localStorage.getItem('onlyScheduledMatches') === '1',
  getUserProfileRequest: createHttpRequestInitResult(),
  editUserProfileRequest: createHttpRequestInitResult(),
  changeUserPasswordRequest: createHttpRequestInitResult(),
  deleteUserAccountRequest: createHttpRequestInitResult(),
};

export const UserSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    toggleOnlyLiveMatches: (state) => {
      state.onlyLiveMatches = !state.onlyLiveMatches;
      localStorage.setItem('onlyLiveMatches', state.onlyLiveMatches ? '1' : '0');
    },
    toggleOnlyScheduledMatches: (state) => {
      state.onlyScheduledMatches = !state.onlyScheduledMatches;
      localStorage.setItem('onlyScheduledMatches', state.onlyScheduledMatches ? '1' : '0');
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
    createExtraReducersForResponses(builder, deleteUserAccount, 'deleteUserAccountRequest');
  },
});

export const { toggleOnlyLiveMatches, toggleOnlyScheduledMatches } = UserSlice.actions;
export const { clearUser } = UserSlice.actions;

export default UserSlice.reducer;
