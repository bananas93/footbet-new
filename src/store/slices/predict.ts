import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createExtraReducersForResponses, createHttpRequestInitResult, getUserDisplayName, supabase } from 'helpers';
import { IHttpRequestResult } from 'interfaces/api';
import { IPredict } from 'interfaces';
import { getMatches } from './match';

interface ISetPredictPayload {
  matchId: number;
  homeScore: number;
  awayScore: number;
  tournamentId: number;
}

interface ISetPredictResponse {
  predict: IPredict;
  message: string;
}

export interface IPredictTableResponse {
  id: string;
  name: string;
  avatar?: string;
  totalMatches: number;
  points: number;
  correctScore: number;
  correctDifference: number;
  fivePlusGoals: number;
  correctResult: number;
}

export const setPredict = createAsyncThunk('predict/setPredict', async (predict: ISetPredictPayload, thunkAPI) => {
  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const userId = authData.user?.id;
  if (!userId) {
    throw new Error('Користувач не авторизований');
  }

  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      {
        match_id: predict.matchId,
        tournament_id: predict.tournamentId,
        user_id: userId,
        home_score: predict.homeScore,
        away_score: predict.awayScore,
      },
      { onConflict: 'match_id,user_id' },
    )
    .select('id, home_score, away_score, points')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await thunkAPI.dispatch(getMatches({ tournamentId: predict.tournamentId, _background: true }));

  return {
    predict: {
      id: data.id,
      homeScore: data.home_score,
      awayScore: data.away_score,
      points: data.points,
    },
    message: 'Predict successfully saved',
  } as ISetPredictResponse;
});

export const getPredictsTable = createAsyncThunk('predict/getPredictsTable', async (tournamentId: number) => {
  const { data, error } = await supabase
    .from('tournament_leaderboard_all')
    .select('user_id, name, total_matches, points, correct_score, correct_difference, five_plus_goals, correct_result')
    .eq('tournament_id', tournamentId)
    .order('points', { ascending: false })
    .order('correct_score', { ascending: false })
    .order('correct_result', { ascending: false })
    .order('correct_difference', { ascending: false })
    .order('five_plus_goals', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const userIds = Array.from(
    new Set(
      (data || [])
        .map((item: any) => item.user_id)
        .filter((value: string | null | undefined): value is string => !!value),
    ),
  );

  let avatarsByUserId = new Map<string, string>();
  if (userIds.length) {
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, avatar').in('id', userIds);
    if (profilesError) {
      throw new Error(profilesError.message);
    }

    avatarsByUserId = new Map(
      (profiles || [])
        .filter((profile: any) => !!profile.id)
        .map((profile: any) => [profile.id, profile.avatar || '']),
    );
  }

  return (data || []).map((item: any) => ({
    id: item.user_id,
    name: item.name,
    avatar: avatarsByUserId.get(item.user_id) || '',
    totalMatches: item.total_matches,
    points: item.points,
    correctScore: item.correct_score,
    correctDifference: item.correct_difference,
    fivePlusGoals: item.five_plus_goals,
    correctResult: item.correct_result,
  })) as IPredictTableResponse[];
});

export const getMatchPredicts = createAsyncThunk('predict/getMatchPredicts', async (matchId: number) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('id, home_score, away_score, points, user:profiles!predictions_user_id_fkey(id, name, nickname, avatar)')
    .eq('match_id', matchId)
    .order('points', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    homeScore: item.home_score,
    awayScore: item.away_score,
    points: item.points,
    user: {
      id: item.user?.id,
      name: getUserDisplayName(item.user?.name, item.user?.nickname),
      avatar: item.user?.avatar || '',
    },
  })) as IPredict[];
});

interface IPredictState {
  setPredictRequest: IHttpRequestResult<ISetPredictResponse>;
  getPredictsTableRequest: IHttpRequestResult<IPredictTableResponse[]>;
  getMatchPredictsRequest: IHttpRequestResult<IPredict[]>;
  table: {
    [key: number]: IPredictTableResponse[];
  };
}

const initialState: IPredictState = {
  setPredictRequest: createHttpRequestInitResult(),
  getPredictsTableRequest: createHttpRequestInitResult(),
  getMatchPredictsRequest: createHttpRequestInitResult(),
  table: {},
};

export const PredictSlice = createSlice({
  name: 'predict',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    createExtraReducersForResponses(builder, setPredict, 'setPredictRequest');
    createExtraReducersForResponses(builder, getPredictsTable, 'getPredictsTableRequest', (state, action) => {
      const tournamentId = action.meta.arg;
      state.table[tournamentId] = action.payload || [];
    });
    createExtraReducersForResponses(builder, getMatchPredicts, 'getMatchPredictsRequest');
  },
});

// export const {} = PredictSlice.actions;

export default PredictSlice.reducer;
