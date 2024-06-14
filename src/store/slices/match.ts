import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createExtraReducersForResponses, createHttpRequestInitResult, http } from 'helpers';
import { AxiosResponse } from 'axios';
import { IGames, IHttpRequestResult } from 'interfaces';

export const getMatches = createAsyncThunk(
  'match/getMatches',
  async ({ tournamentId, _background = false }: { tournamentId: number; _background?: boolean }) => {
    const response: AxiosResponse<IGames[]> = await http.api.get(`/match/all/${tournamentId}`);
    return response.data;
  },
);

interface IMatchesState {
  matches: {
    [key: string]: IGames[];
  };
  getMatchesRequest: IHttpRequestResult<IGames[]>;
}

const initialState: IMatchesState = {
  matches: {},
  getMatchesRequest: createHttpRequestInitResult(),
};

export const MatchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    createExtraReducersForResponses(builder, getMatches, 'getMatchesRequest', (state, action) => {
      const { tournamentId } = action.meta.arg;
      state.matches[tournamentId] = action.payload;
    });
  },
});

// export const { } = MatchSlice.actions;

export default MatchSlice.reducer;
