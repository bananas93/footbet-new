import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../helpers/supabase';
import { IMatch } from '../../interfaces/match';
import { Box, Button, Card, CardActions, CardContent, Typography } from '@mui/material';
import { notify } from '../../helpers/notify';
import { mapMatchFromDb } from '../../helpers/mappers';
import { sendMatchUpdatePush } from '../../helpers/push';

interface IFormData {
  homeScore?: number;
  awayScore?: number;
  status?: string;
}

interface IUpdateMatchMutationPayload {
  matchId: number;
  match: IMatch;
  formData: IFormData;
}

const Home = () => {
  const { isLoading, data } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          id,
          stage,
          group_tour,
          status,
          result,
          group_name,
          match_date,
          home_score,
          away_score,
          tournament:tournaments(id, name),
          homeTeam:teams!matches_home_team_id_fkey(id, name, logo),
          awayTeam:teams!matches_away_team_id_fkey(id, name, logo)
        `,
        )
        .eq('status', 'Live')
        .order('match_date', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(mapMatchFromDb) as IMatch[];
    },
  });

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ matchId, formData }: IUpdateMatchMutationPayload) => {
      const payload: Record<string, any> = {};
      if (typeof formData.homeScore === 'number') {
        payload.home_score = formData.homeScore;
      }
      if (typeof formData.awayScore === 'number') {
        payload.away_score = formData.awayScore;
      }
      if (formData.status) {
        payload.status = formData.status;
      }

      const { error } = await supabase.from('matches').update(payload).eq('id', matchId);
      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Матч оновлено' };
    },
    onSuccess: async (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      notify.success(response.message);

      try {
        await sendMatchUpdatePush({
          tournamentId: variables.match.tournament.id,
          tournamentName: variables.match.tournament.name,
          homeTeamName: variables.match.homeTeam.name,
          awayTeamName: variables.match.awayTeam.name,
          previousHomeScore: variables.match.homeScore,
          previousAwayScore: variables.match.awayScore,
          homeScore:
            typeof variables.formData.homeScore === 'number' ? variables.formData.homeScore : variables.match.homeScore,
          awayScore:
            typeof variables.formData.awayScore === 'number' ? variables.formData.awayScore : variables.match.awayScore,
          status: variables.formData.status || variables.match.status,
        });
      } catch {
        notify.warning('Матч оновлено, але push-сповіщення не відправлено');
      }
    },
    onError: (err: any) => {
      notify.error(err.message);
    },
  });

  const handleScoreHome = (match: IMatch) => {
    mutation.mutate({
      matchId: match.id,
        match,
      formData: {
        homeScore: match.homeScore + 1,
      },
    });
  };

  const handleScoreAway = (match: IMatch) => {
    mutation.mutate({
      matchId: match.id,
        match,
      formData: {
        awayScore: match.awayScore + 1,
      },
    });
  };

  const handleFinishMatch = (match: IMatch) => {
    mutation.mutate({
      matchId: match.id,
        match,
      formData: {
        status: 'Finished',
      },
    });
  };

  const handleCancelScoreHome = (match: IMatch) => {
    if (match.homeScore > 0) {
      mutation.mutate({
        matchId: match.id,
        match,
        formData: {
          homeScore: match.homeScore - 1,
        },
      });
    }
  };

  const handleCancelScoreAway = (match: IMatch) => {
    if (match.awayScore > 0) {
      mutation.mutate({
        matchId: match.id,
        match,
        formData: {
          awayScore: match.awayScore - 1,
        },
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <Box>
      <h1>Live матчі</h1>
      {(data || []).map((match: IMatch) => (
        <Card key={match.id} style={{ marginBottom: '16px' }}>
          <CardContent>
            <Typography gutterBottom variant="h6" component="span">
              {match.homeTeam.name}
            </Typography>{' '}
            <Typography variant="h6" component="span">
              {match.homeScore} - {match.awayScore}
            </Typography>{' '}
            <Typography variant="h6" component="span">
              {match.awayTeam.name}
            </Typography>
            <CardActions>
              <Button variant="contained" size="small" onClick={() => handleScoreHome(match)}>
                {match.homeTeam.name} Забила
              </Button>
              <Button variant="contained" size="small" onClick={() => handleScoreAway(match)}>
                {match.awayTeam.name} Забила
              </Button>
              <Button variant="outlined" size="small" onClick={() => handleFinishMatch(match)}>
                Закінчити матч
              </Button>
            </CardActions>
            <CardActions>
              <Button
                variant="contained"
                disabled={match.homeScore < 1}
                color="error"
                size="small"
                onClick={() => handleCancelScoreHome(match)}>
                {match.homeTeam.name} - Скасувати гол
              </Button>
              <Button
                variant="contained"
                disabled={match.awayScore < 1}
                color="error"
                size="small"
                onClick={() => handleCancelScoreAway(match)}>
                {match.awayTeam.name} - Скасувати гол
              </Button>
            </CardActions>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default Home;
