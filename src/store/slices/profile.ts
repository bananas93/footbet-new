import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createExtraReducersForResponses, createHttpRequestInitResult, http } from 'helpers';
import { AxiosResponse } from 'axios';
import { IHttpRequestResult, IStatistics, IUser } from 'interfaces';

interface IProfileResponse {
  user: IUser;
  statistics: IStatistics;
}

export const getProfile = createAsyncThunk(
  'profile/getProfile',
  async ({ userId, tournamentId }: { userId: number; tournamentId: number }) => {
    const response: AxiosResponse<IProfileResponse> = await http.api.get(`/user/${userId}/${tournamentId}`);
    return response.data;
  },
);

interface IProfileState {
  getProfileRequest: IHttpRequestResult<IProfileResponse>;
}

const initialState: IProfileState = {
  getProfileRequest: createHttpRequestInitResult(),
};

export const ProfileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    createExtraReducersForResponses(builder, getProfile, 'getProfileRequest');
  },
});

// export const { } = ProfileSlice.actions;

export default ProfileSlice.reducer;
