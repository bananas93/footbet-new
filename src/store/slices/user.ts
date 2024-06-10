import { AxiosResponse } from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { IUser, IHttpRequestResult } from 'interfaces';
import { createExtraReducersForResponses, createHttpRequestInitResult, http } from 'helpers';

interface IChangeUserPasswordData {
  oldPassword: string;
  password: string;
}

export const getUserProfile = createAsyncThunk('user/getUserProfile', async (_background: boolean = false) => {
  const response: AxiosResponse<IUser> = await http.api.get(`/user`);
  return response.data;
});

export const editUserProfile = createAsyncThunk('user/editUserProfile', async (data: Partial<IUser>, thunkAPI) => {
  const response: AxiosResponse<IUser> = await http.api.put(`/user`, data);
  await thunkAPI.dispatch(getUserProfile(true));
  return response.data;
});

export const changeUserPassword = createAsyncThunk('user/changeUserPassword', async (data: IChangeUserPasswordData) => {
  await http.api.put(`/user/password`, data);
});

interface IUserState {
  user: IUser | null;
  getUserProfileRequest: IHttpRequestResult<IUser>;
  editUserProfileRequest: IHttpRequestResult<IUser>;
  changeUserPasswordRequest: IHttpRequestResult<void>;
}

const initialState: IUserState = {
  user: null,
  getUserProfileRequest: createHttpRequestInitResult(),
  editUserProfileRequest: createHttpRequestInitResult(),
  changeUserPasswordRequest: createHttpRequestInitResult(),
};

export const UserSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    createExtraReducersForResponses(builder, getUserProfile, 'getUserProfileRequest', (state, action) => {
      state.user = action.payload;
    });
    createExtraReducersForResponses(builder, editUserProfile, 'editUserProfileRequest');
    createExtraReducersForResponses(builder, changeUserPassword, 'changeUserPasswordRequest');
  },
});

// export const {} = UserSlice.actions;

export default UserSlice.reducer;
