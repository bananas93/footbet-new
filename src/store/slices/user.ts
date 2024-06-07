import { AxiosResponse } from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { IUser, IHttpRequestResult } from 'interfaces';
import { createExtraReducersForResponses, createHttpRequestInitResult, http } from 'helpers';

export const getUserProfile = createAsyncThunk('user/getUserProfile', async () => {
  const response: AxiosResponse<IUser> = await http.api.get(`/user`);
  return response.data;
});

export const editUserProfile = createAsyncThunk('user/editUserProfile', async (data: Partial<IUser>) => {
  const response: AxiosResponse<IUser> = await http.api.put(`/user`, data);
  return response.data;
});

interface IUserState {
  user: IUser | null;
  getUserProfileRequest: IHttpRequestResult<IUser>;
  editUserProfileRequest: IHttpRequestResult<IUser>;
}

const initialState: IUserState = {
  user: null,
  getUserProfileRequest: createHttpRequestInitResult(),
  editUserProfileRequest: createHttpRequestInitResult(),
};

export const UserSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    createExtraReducersForResponses(builder, getUserProfile, 'getUserProfileRequest', (state, action) => {
      state.user = action.payload;
    });
    createExtraReducersForResponses(builder, editUserProfile, 'editUserProfileRequest', (state, action) => {
      state.user = action.payload;
    });
  },
});

// export const {} = UserSlice.actions;

export default UserSlice.reducer;
