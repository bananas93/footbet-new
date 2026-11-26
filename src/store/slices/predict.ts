import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createExtraReducersForResponses,
  createHttpRequestInitResult,
  getUserDisplayName,
  supabase,
  trackEvent,
} from 'helpers';
import { translate } from 'i18n';
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
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const userId = authData.user?.id;
  if (!userId) {
    throw new Error(translate('errors.user.notAuthorized'));
  }

  const { data: existingPrediction, error: existingPredictionError } = await supabase
    .from('predictions')
    .select('id')
    .eq('match_id', predict.matchId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingPredictionError) {
    throw new Error(existingPredictionError.message);
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

  trackEvent(existingPrediction?.id ? 'prediction_updated' : 'prediction_created', {
    match_id: predict.matchId,
    tournament_id: predict.tournamentId,
  });

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
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, avatar')
      .in('id', userIds);
    if (profilesError) {
      throw new Error(profilesError.message);
    }

    avatarsByUserId = new Map(
      (profiles || []).filter((profile: any) => !!profile.id).map((profile: any) => [profile.id, profile.avatar || '']),
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

export interface IRoundPredictRow {
  userId: string;
  matchId: number;
  homeScore: number;
  awayScore: number;
  points: number;
}

interface IGetRoundPredictsPayload {
  tournamentId: number;
  roundKey: string;
  matchIds: number[];
}

export interface IRoundPredictsResponse {
  key: string;
  rows: IRoundPredictRow[];
}

export const buildRoundPredictsKey = (tournamentId: number, roundKey: string) => `${tournamentId}:${roundKey}`;

// PostgREST caps a response at 1000 rows, and one round holds a row per player
// per match, so the result is read page by page.
const ROUND_PREDICTS_PAGE_SIZE = 1000;
const ROUND_PREDICTS_MAX_PAGES = 20;

export const getRoundPredicts = createAsyncThunk(
  'predict/getRoundPredicts',
  async ({ tournamentId, roundKey, matchIds }: IGetRoundPredictsPayload) => {
    const key = buildRoundPredictsKey(tournamentId, roundKey);

    if (!matchIds.length) {
      return { key, rows: [] as IRoundPredictRow[] };
    }

    const rows: IRoundPredictRow[] = [];

    for (let page = 0; page < ROUND_PREDICTS_MAX_PAGES; page += 1) {
      const from = page * ROUND_PREDICTS_PAGE_SIZE;

      const { data, error } = await supabase
        .from('predictions')
        .select('user_id, match_id, home_score, away_score, points')
        .eq('tournament_id', tournamentId)
        .in('match_id', matchIds)
        .order('match_id', { ascending: true })
        .order('user_id', { ascending: true })
        .range(from, from + ROUND_PREDICTS_PAGE_SIZE - 1);

      if (error) {
        throw new Error(error.message);
      }

      (data || []).forEach((item: any) => {
        rows.push({
          userId: item.user_id,
          matchId: item.match_id,
          homeScore: item.home_score,
          awayScore: item.away_score,
          points: item.points || 0,
        });
      });

      if (!data || data.length < ROUND_PREDICTS_PAGE_SIZE) {
        break;
      }
    }

    return { key, rows };
  },
);

interface IPredictState {
  setPredictRequest: IHttpRequestResult<ISetPredictResponse>;
  getPredictsTableRequest: IHttpRequestResult<IPredictTableResponse[]>;
  getMatchPredictsRequest: IHttpRequestResult<IPredict[]>;
  // Which match the data in getMatchPredictsRequest belongs to, so a consumer
  // never renders another match's predictions.
  matchPredictsMatchId: number | null;
  // Guards against out-of-order responses: only the latest request may write.
  matchPredictsRequestId: string | null;
  getRoundPredictsRequest: IHttpRequestResult<IRoundPredictsResponse>;
  // Round the data in getRoundPredictsRequest belongs to, same guard as above.
  roundPredictsKey: string | null;
  roundPredictsRequestId: string | null;
  // Cached per `${tournamentId}:${roundKey}` so switching rounds is instant.
  roundPredicts: {
    [key: string]: IRoundPredictRow[];
  };
  table: {
    [key: number]: IPredictTableResponse[];
  };
}

const initialState: IPredictState = {
  setPredictRequest: createHttpRequestInitResult(),
  getPredictsTableRequest: createHttpRequestInitResult(),
  getMatchPredictsRequest: createHttpRequestInitResult(),
  matchPredictsMatchId: null,
  matchPredictsRequestId: null,
  getRoundPredictsRequest: createHttpRequestInitResult(),
  roundPredictsKey: null,
  roundPredictsRequestId: null,
  roundPredicts: {},
  table: {},
};

export const PredictSlice = createSlice({
  name: 'predict',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    createExtraReducersForResponses(builder, setPredict, 'setPredictRequest');
    builder.addCase(getRoundPredicts.pending, (state, action) => {
      state.getRoundPredictsRequest.isLoading = true;
      state.getRoundPredictsRequest.isSuccess = false;
      state.getRoundPredictsRequest.isError = false;
      state.getRoundPredictsRequest.error = undefined;
      state.roundPredictsKey = buildRoundPredictsKey(action.meta.arg.tournamentId, action.meta.arg.roundKey);
      state.roundPredictsRequestId = action.meta.requestId;
    });
    builder.addCase(getRoundPredicts.fulfilled, (state, action) => {
      // Cache every answer, even a late one: it is keyed by its own round.
      state.roundPredicts[action.payload.key] = action.payload.rows;

      if (state.roundPredictsRequestId !== action.meta.requestId) {
        return;
      }

      state.getRoundPredictsRequest.isUninitialized = false;
      state.getRoundPredictsRequest.isLoading = false;
      state.getRoundPredictsRequest.isSuccess = true;
      state.getRoundPredictsRequest.isError = false;
      state.getRoundPredictsRequest.error = undefined;
      state.getRoundPredictsRequest.data = action.payload;
    });
    builder.addCase(getRoundPredicts.rejected, (state, action) => {
      if (state.roundPredictsRequestId !== action.meta.requestId) {
        return;
      }

      state.getRoundPredictsRequest.isLoading = false;
      state.getRoundPredictsRequest.isSuccess = false;

      if (action.meta.aborted) {
        state.roundPredictsKey = null;
        state.roundPredictsRequestId = null;
        return;
      }

      state.getRoundPredictsRequest.isUninitialized = false;
      state.getRoundPredictsRequest.isError = true;
      state.getRoundPredictsRequest.error = action.error;
    });
    createExtraReducersForResponses(builder, getPredictsTable, 'getPredictsTableRequest', (state, action) => {
      const tournamentId = action.meta.arg;
      state.table[tournamentId] = action.payload || [];
    });
    builder.addCase(getMatchPredicts.pending, (state, action) => {
      state.getMatchPredictsRequest.isLoading = true;
      state.getMatchPredictsRequest.isSuccess = false;
      state.getMatchPredictsRequest.isError = false;
      state.getMatchPredictsRequest.error = undefined;
      // Drop the previous match's rows immediately, otherwise they are rendered
      // under the new match's header until the new response arrives.
      state.getMatchPredictsRequest.data = undefined;
      state.matchPredictsMatchId = action.meta.arg;
      state.matchPredictsRequestId = action.meta.requestId;
    });
    builder.addCase(getMatchPredicts.fulfilled, (state, action) => {
      if (state.matchPredictsRequestId !== action.meta.requestId) {
        return;
      }

      state.getMatchPredictsRequest.isUninitialized = false;
      state.getMatchPredictsRequest.isLoading = false;
      state.getMatchPredictsRequest.isSuccess = true;
      state.getMatchPredictsRequest.isError = false;
      state.getMatchPredictsRequest.error = undefined;
      state.getMatchPredictsRequest.data = action.payload;
      state.matchPredictsMatchId = action.meta.arg;
    });
    builder.addCase(getMatchPredicts.rejected, (state, action) => {
      if (state.matchPredictsRequestId !== action.meta.requestId) {
        return;
      }

      if (action.meta.aborted) {
        // Modal closed or switched match: reset instead of surfacing an error.
        state.getMatchPredictsRequest.isLoading = false;
        state.getMatchPredictsRequest.isSuccess = false;
        state.getMatchPredictsRequest.isError = false;
        state.getMatchPredictsRequest.error = undefined;
        state.getMatchPredictsRequest.data = undefined;
        state.matchPredictsMatchId = null;
        state.matchPredictsRequestId = null;
        return;
      }

      state.getMatchPredictsRequest.isUninitialized = false;
      state.getMatchPredictsRequest.isLoading = false;
      state.getMatchPredictsRequest.isSuccess = false;
      state.getMatchPredictsRequest.isError = true;
      state.getMatchPredictsRequest.error = action.error;
      state.getMatchPredictsRequest.data = undefined;
      state.matchPredictsMatchId = action.meta.arg;
    });
  },
});

// export const {} = PredictSlice.actions;

export default PredictSlice.reducer;
