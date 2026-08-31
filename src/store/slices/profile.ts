import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createExtraReducersForResponses, createHttpRequestInitResult, supabase } from 'helpers';
import { IHttpRequestResult, IStatistics, IUser, MatchStatus } from 'interfaces';

interface IProfileResponse {
  user: IUser;
  statistics: IStatistics;
}

type ProfilePredictionRow = {
  homeScore: number;
  awayScore: number;
  points: number;
  correctScore: number;
  correctResult: number;
  correctDifference: number;
  fivePlusGoals: number;
  homeTeamName: string;
  awayTeamName: string;
  matchStatus: MatchStatus | null;
};

const getEmptyStatistics = (): IStatistics => ({
  total: 0,
  totalPoints: 0,
  correctScore: 0,
  correctDifference: 0,
  fivePlusGoals: 0,
  correctResult: 0,
  correctScorePercentage: 0,
  correctResultPercentage: 0,
  correctScorePerRow: 0,
  correctResultPerRow: 0,
  longestLosingStreak: 0,
  mostCommonCorrectScore: '',
  correctHomePredictions: 0,
  correctAwayPredictions: 0,
  mostCommonPrediction: 'draw',
  topFiveFavoriteTeams: [],
  mostPopularPredictedScore: '',
});

const calculateStats = (predicts: ProfilePredictionRow[]): IStatistics => {
  const statistics = getEmptyStatistics();
  statistics.total = predicts.length;

  if (!predicts.length) {
    return statistics;
  }

  let currentCorrectScoreStreak = 0;
  let maxCorrectScoreStreak = 0;
  let currentCorrectResultStreak = 0;
  let maxCorrectResultStreak = 0;
  let currentLosingStreak = 0;
  let maxLosingStreak = 0;

  const teamPoints: Record<string, number> = {};
  const correctScoreCounts: Record<string, number> = {};
  const predictedScoreCounts: Record<string, number> = {};

  let homePredictions = 0;
  let awayPredictions = 0;
  let drawPredictions = 0;

  predicts.forEach((prediction) => {
    const points = Number(prediction.points) || 0;
    const correctScore = Number(prediction.correctScore) || 0;
    const correctResult = Number(prediction.correctResult) || 0;
    const correctDifference = Number(prediction.correctDifference) || 0;
    const fivePlusGoals = Number(prediction.fivePlusGoals) || 0;
    const homeScore = Number(prediction.homeScore) || 0;
    const awayScore = Number(prediction.awayScore) || 0;

    statistics.totalPoints += points;

    teamPoints[prediction.homeTeamName] = (teamPoints[prediction.homeTeamName] || 0) + points;
    teamPoints[prediction.awayTeamName] = (teamPoints[prediction.awayTeamName] || 0) + points;

    const predictedScoreKey = `${homeScore}-${awayScore}`;
    predictedScoreCounts[predictedScoreKey] = (predictedScoreCounts[predictedScoreKey] || 0) + 1;

    const hasAnyHit = correctScore !== 0 || correctResult !== 0 || correctDifference !== 0;
    if (hasAnyHit) {
      currentLosingStreak = 0;
    } else {
      currentLosingStreak += 1;
      maxLosingStreak = Math.max(maxLosingStreak, currentLosingStreak);
    }

    if (correctScore !== 0) {
      statistics.correctScore += 1;
      currentCorrectScoreStreak += 1;
      maxCorrectScoreStreak = Math.max(maxCorrectScoreStreak, currentCorrectScoreStreak);

      const scoreKey = `${homeScore}-${awayScore}`;
      correctScoreCounts[scoreKey] = (correctScoreCounts[scoreKey] || 0) + 1;
    } else {
      currentCorrectScoreStreak = 0;
    }

    if (correctResult !== 0) {
      statistics.correctResult += 1;
      currentCorrectResultStreak += 1;
      maxCorrectResultStreak = Math.max(maxCorrectResultStreak, currentCorrectResultStreak);
    } else {
      currentCorrectResultStreak = 0;
    }

    if (correctDifference !== 0) {
      statistics.correctDifference += 1;
    }

    if (fivePlusGoals !== 0) {
      statistics.fivePlusGoals += 1;
    }

    if (homeScore > awayScore) {
      homePredictions += 1;
      if (correctResult !== 0) {
        statistics.correctHomePredictions += 1;
      }
    } else if (awayScore > homeScore) {
      awayPredictions += 1;
      if (correctResult !== 0) {
        statistics.correctAwayPredictions += 1;
      }
    } else {
      drawPredictions += 1;
    }
  });

  const mostCommonCorrectScore = Object.entries(correctScoreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const mostPopularPredictedScore = Object.entries(predictedScoreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  statistics.mostCommonCorrectScore = mostCommonCorrectScore;
  statistics.mostPopularPredictedScore = mostPopularPredictedScore;
  statistics.correctScorePercentage = statistics.total > 0 ? (statistics.correctScore / statistics.total) * 100 : 0;
  statistics.correctResultPercentage = statistics.total > 0 ? (statistics.correctResult / statistics.total) * 100 : 0;
  statistics.correctScorePerRow = maxCorrectScoreStreak;
  statistics.correctResultPerRow = maxCorrectResultStreak;
  statistics.longestLosingStreak = maxLosingStreak;

  statistics.mostCommonPrediction =
    homePredictions > awayPredictions && homePredictions > drawPredictions
      ? 'home'
      : awayPredictions > drawPredictions
        ? 'away'
        : 'draw';

  statistics.topFiveFavoriteTeams = Object.entries(teamPoints)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([team, points]) => ({ team, points }));

  return statistics;
};

export const getProfile = createAsyncThunk(
  'profile/getProfile',
  async ({ userId, tournamentId }: { userId: string; tournamentId: number | null }) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, phone, name, nickname, avatar, role')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    if (!profile) {
      throw new Error('User not found');
    }

    let predictsQuery = supabase
      .from('predictions')
      .select(
        `
        home_score,
        away_score,
        points,
        correct_score,
        correct_result,
        correct_difference,
        five_plus_goals,
        match:matches!predictions_match_id_fkey(
          status,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        )
      `,
      )
      .eq('user_id', userId);

    if (typeof tournamentId === 'number' && Number.isFinite(tournamentId)) {
      predictsQuery = predictsQuery.eq('tournament_id', tournamentId);
    }

    const { data: predicts, error: predictsError } = await predictsQuery;

    if (predictsError) {
      throw new Error(predictsError.message);
    }

    const normalizedPredicts: ProfilePredictionRow[] = (predicts || []).map((item: any) => ({
      homeScore: item.home_score,
      awayScore: item.away_score,
      points: item.points,
      correctScore: item.correct_score,
      correctResult: item.correct_result,
      correctDifference: item.correct_difference,
      fivePlusGoals: item.five_plus_goals,
      homeTeamName: item.match?.home_team?.name || '',
      awayTeamName: item.match?.away_team?.name || '',
      matchStatus: item.match?.status || null,
    }));

    const finishedOrLivePredicts = normalizedPredicts.filter(
      (item) => item.matchStatus === MatchStatus.IN_PROGRESS || item.matchStatus === MatchStatus.FINISHED,
    );

    return {
      user: {
        id: profile.id,
        email: profile.email || '',
        phone: profile.phone || '',
        name: profile.name,
        nickname: profile.nickname || '',
        avatar: profile.avatar || '',
        role: profile.role,
      },
      statistics: calculateStats(finishedOrLivePredicts),
    } as IProfileResponse;
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
