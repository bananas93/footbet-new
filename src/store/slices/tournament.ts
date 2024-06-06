import { AxiosResponse } from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { IStandings, ITournament, TournamentType, IHttpRequestResult } from 'interfaces';
import { createExtraReducersForResponses, createHttpRequestInitResult, http } from 'helpers';

export const getTournaments = createAsyncThunk('tournament/getTournaments', async (type?: TournamentType) => {
  const response: AxiosResponse<ITournament[]> = await http.api.get(`/tournament`, { params: { type } });
  return response.data;
});

export const getOneTournament = createAsyncThunk('tournament/getOneTournament', async (id: number) => {
  const response: AxiosResponse<ITournament> = await http.api.get(`/tournament/${id}`);
  return response.data;
});

export const getTournamentStandings = createAsyncThunk('tournament/getTournamentStandings', async (id: number) => {
  const response: AxiosResponse<IStandings[]> = await http.api.get(`/tournament/${id}/standings`);
  return response.data;
});

interface ITournamentState {
  tournaments: ITournament[];
  standings: {
    [key: string]: IStandings[];
  };
  getTournamentsRequest: IHttpRequestResult<ITournament>;
  getOneTournamentRequest: IHttpRequestResult<ITournament>;
  getTournamentStandingsRequest: IHttpRequestResult<IStandings[]>;
}

const initialState: ITournamentState = {
  tournaments: [],
  standings: {},
  getTournamentsRequest: createHttpRequestInitResult(),
  getOneTournamentRequest: createHttpRequestInitResult(),
  getTournamentStandingsRequest: createHttpRequestInitResult(),
};

export const TournamentSlice = createSlice({
  name: 'tournament',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    createExtraReducersForResponses(builder, getTournaments, 'getTournamentsRequest', (state, action) => {
      state.tournaments = action.payload;
    });
    createExtraReducersForResponses(builder, getOneTournament, 'getOneTournamentRequest');
    createExtraReducersForResponses(
      builder,
      getTournamentStandings,
      'getTournamentStandingsRequest',
      (state, action) => {
        const id = action.meta.arg;
        state.standings[id] = action.payload;
      },
    );
  },
});

// export const {} = TournamentSlice.actions;

export default TournamentSlice.reducer;
