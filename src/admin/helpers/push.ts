import { supabase } from './supabase';

const PUSH_FUNCTION_NAME = process.env.REACT_APP_PUSH_FUNCTION_NAME?.trim() || 'push';

export interface MatchPushInput {
  tournamentId?: number;
  tournamentName?: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  previousHomeScore?: number;
  previousAwayScore?: number;
  status?: string;
}

const resolveTitle = (input: MatchPushInput): string => `${input.homeTeamName} - ${input.awayTeamName}`;

const resolveBody = (input: MatchPushInput): string => {
  const hasScore = typeof input.homeScore === 'number' && typeof input.awayScore === 'number';
  const hasPreviousScore = typeof input.previousHomeScore === 'number' && typeof input.previousAwayScore === 'number';

  if (!hasScore) {
    return 'Оновлення матчу';
  }

  const currentHomeScore = Number(input.homeScore);
  const currentAwayScore = Number(input.awayScore);
  const score = `${currentHomeScore}:${currentAwayScore}`;

  if (!hasPreviousScore) {
    return `Гол • рахунок ${score}`;
  }

  const previousHomeScore = Number(input.previousHomeScore);
  const previousAwayScore = Number(input.previousAwayScore);
  const deltaHome = currentHomeScore - previousHomeScore;
  const deltaAway = currentAwayScore - previousAwayScore;

  if (deltaHome > 0 && deltaAway <= 0) {
    return `Гол [${input.homeTeamName}] • рахунок ${score}`;
  }

  if (deltaAway > 0 && deltaHome <= 0) {
    return `Гол [${input.awayTeamName}] • рахунок ${score}`;
  }

  if (deltaHome < 0 && deltaAway >= 0) {
    return `Скасовано гол [${input.homeTeamName}] • рахунок ${score}`;
  }

  if (deltaAway < 0 && deltaHome >= 0) {
    return `Скасовано гол [${input.awayTeamName}] • рахунок ${score}`;
  }

  return `Гол • рахунок ${score}`;
};

export const sendMatchUpdatePush = async (input: MatchPushInput): Promise<void> => {
  const title = resolveTitle(input);
  const body = resolveBody(input);
  const url = input.tournamentId ? `/tournament/${input.tournamentId}` : '/';

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error('Відсутня активна сесія для відправки push');
  }

  const { error } = await supabase.functions.invoke(PUSH_FUNCTION_NAME, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      title,
      body,
      url,
      data: {
        type: 'match_update',
        tournamentId: input.tournamentId || null,
        tournamentName: input.tournamentName || null,
        homeTeamName: input.homeTeamName,
        awayTeamName: input.awayTeamName,
        status: input.status || null,
        homeScore: typeof input.homeScore === 'number' ? input.homeScore : null,
        awayScore: typeof input.awayScore === 'number' ? input.awayScore : null,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }
};
