import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { IStandings, ITournament, TournamentType, IHttpRequestResult } from 'interfaces';
import { createExtraReducersForResponses, createHttpRequestInitResult, supabase } from 'helpers';

export const getTournaments = createAsyncThunk('tournament/getTournaments', async (type?: TournamentType) => {
  let query = supabase.from('tournaments').select('*').order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    groupNumber: item.group_number,
    groupMatchNumber: item.group_match_number,
    knockoutRound: item.knockout_round,
    directNextRound: item.direct_next_round,
    playoffRound: item.playoff_round,
    thirdPlaceMatch: item.third_place_match,
    hasTable: item.has_table,
    leagues: item.leagues,
    isNationsLeague: !!item.is_nations_league,
    status: item.status,
    logo: item.logo,
    type: item.type,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  })) as ITournament[];
});

export const getOneTournament = createAsyncThunk('tournament/getOneTournament', async (id: number) => {
  const { data, error } = await supabase.from('tournaments').select('*').eq('id', id).single();
  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    name: data.name,
    groupNumber: data.group_number,
    groupMatchNumber: data.group_match_number,
    knockoutRound: data.knockout_round,
    directNextRound: data.direct_next_round,
    playoffRound: data.playoff_round,
    thirdPlaceMatch: data.third_place_match,
    hasTable: data.has_table,
    leagues: data.leagues,
    isNationsLeague: !!data.is_nations_league,
    status: data.status,
    logo: data.logo,
    type: data.type,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as ITournament;
});

export const getTournamentStandings = createAsyncThunk('tournament/getTournamentStandings', async (id: number) => {
  const { data, error } = await supabase.rpc('get_tournament_standings', { p_tournament_id: id });
  if (error) {
    throw new Error(error.message);
  }

  return {
    standings: data?.standings || {},
    thirdPlacesStandings: data?.thirdPlacesStandings || [],
  } as IStandings;
});

interface ITournamentState {
  tournaments: ITournament[];
  standings: {
    [key: string]: IStandings;
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
