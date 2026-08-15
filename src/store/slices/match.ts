import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createExtraReducersForResponses, createHttpRequestInitResult, supabase } from 'helpers';
import { IGames, IHttpRequestResult, IMatch, MatchStage } from 'interfaces';

export const getMatches = createAsyncThunk(
  'match/getMatches',
  async ({ tournamentId, _background = false }: { tournamentId: number; _background?: boolean }) => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(sessionError.message);
    }

    // Public pages can be viewed without auth; personal predicts are loaded only for signed-in users.
    const userId = session?.user?.id;

    const { data: matchesRaw, error: matchesError } = await supabase
      .from('matches')
      .select(
        `
        id,
        stage,
        group_tour,
        status,
        result,
        group_name,
        tournament_league,
        api_fixture_id,
        home_score,
        away_score,
        match_date,
        tournament_id,
        home_team_id,
        away_team_id,
        created_at,
        updated_at,
        homeTeam:teams!matches_home_team_id_fkey(id, api_team_id, name, logo),
        awayTeam:teams!matches_away_team_id_fkey(id, api_team_id, name, logo)
      `,
      )
      .eq('tournament_id', tournamentId)
      .order('match_date', { ascending: true });

    if (matchesError) {
      throw new Error(matchesError.message);
    }

    let predictionsMap: Record<number, any> = {};
    if (userId) {
      const { data: predictionsRaw, error: predictionsError } = await supabase
        .from('predictions')
        .select('id, match_id, home_score, away_score, points')
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId);

      if (predictionsError) {
        throw new Error(predictionsError.message);
      }

      predictionsMap = (predictionsRaw || []).reduce((acc: Record<number, any>, item: any) => {
        acc[item.match_id] = item;
        return acc;
      }, {});
    }

    const matches = (matchesRaw || []).map((match: any) => {
      const ownPredict = predictionsMap[match.id];

      return {
        id: match.id,
        stage: match.stage,
        groupTour: match.group_tour,
        status: match.status,
        result: match.result,
        groupName: match.group_name,
        tournamentLeague: Number(match.tournament_league || 1),
        apiFixtureId: match.api_fixture_id || undefined,
        homeScore: match.home_score,
        awayScore: match.away_score,
        matchDate: match.match_date,
        tournamentId: match.tournament_id,
        homeTeamId: match.home_team_id,
        awayTeamId: match.away_team_id,
        createdAt: match.created_at,
        updatedAt: match.updated_at,
        homeTeam: match.homeTeam
          ? {
              ...match.homeTeam,
              apiTeamId: match.homeTeam.api_team_id || undefined,
            }
          : match.homeTeam,
        awayTeam: match.awayTeam
          ? {
              ...match.awayTeam,
              apiTeamId: match.awayTeam.api_team_id || undefined,
            }
          : match.awayTeam,
        predict: ownPredict
          ? {
              id: ownPredict.id,
              homeScore: ownPredict.home_score,
              awayScore: ownPredict.away_score,
              points: ownPredict.points,
            }
          : undefined,
      } as IMatch;
    });

    const groupedMatches: Record<string, IMatch[]> = {};

    matches.forEach((match) => {
      const stage = match.stage === MatchStage.GROUP_STAGE ? match.groupTour : match.stage;
      if (!groupedMatches[stage]) {
        groupedMatches[stage] = [];
      }
      groupedMatches[stage].push(match);
    });

    let groupId = 1;
    return Object.keys(groupedMatches).map((stage) => {
      const stageMatches = groupedMatches[stage];
      return {
        id: groupId++,
        stage,
        startDate: stageMatches[0].matchDate,
        endDate: stageMatches[stageMatches.length - 1].matchDate,
        data: stageMatches,
      } as IGames;
    });
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
