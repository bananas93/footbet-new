import { FC, Fragment, useState } from 'react';
import Modal from '../../../components/Modal/Modal';
import { Autocomplete, CircularProgress, FormControl, Grid, TextField } from '@mui/material';
import { IMatch } from '../../../interfaces/match';
import { supabase } from '../../../helpers/supabase';
import { ITournament } from '../../../interfaces/tournament';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IUser } from '../../../interfaces/user';
import { notify } from '../../../helpers/notify';
import { mapMatchFromDb, mapTournamentFromDb, mapUserFromDb } from '../../../helpers/mappers';

interface Props {
  isOpen: boolean;
  handleClose: () => void;
}

const CreatePredictModal: FC<Props> = ({ isOpen, handleClose }) => {
  const [openTournament, setOpenTournament] = useState(false);
  const [tournament, setTournament] = useState<ITournament | null>(null);
  const [tournamentValue, setTournamentValue] = useState('');

  const [openUser, setOpenUser] = useState(false);
  const [user, setUser] = useState<IUser | null>(null);
  const [userValue, setUserValue] = useState('');

  const [openMatch, setOpenMatch] = useState(false);
  const [match, setMatch] = useState<IMatch | null>(null);
  const [matchValue, setMatchValue] = useState('');

  const PaperProps = {
    component: 'form',
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const formJson = Object.fromEntries((formData as any).entries());
      const data = {
        tournamentId: tournament?.id,
        matchId: match?.id,
        userId: user?.id,
        homeScore: formJson.homeScore,
        awayScore: formJson.awayScore,
      };
      mutation.mutate(data);
    },
  };

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from('predictions').upsert(
        {
          tournament_id: formData.tournamentId,
          match_id: formData.matchId,
          user_id: formData.userId,
          home_score: Number(formData.homeScore),
          away_score: Number(formData.awayScore),
        },
        { onConflict: 'match_id,user_id' },
      );

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Прогноз успішно збережено' };
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['predicts'] });
      notify.success(response.message);
      handleClose();
    },
    onError: (err: any) => {
      notify.error(err.message);
    },
  });

  const { isLoading, data: tournaments } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(mapTournamentFromDb) as ITournament[];
    },
  });
  const { isLoading: isLoadingUsers, data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, nickname, role, email, phone, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(mapUserFromDb) as IUser[];
    },
  });
  const { isLoading: isLoadingTournament, data } = useQuery({
    queryKey: ['matches', tournament?.id],
    enabled: !!tournament?.id,
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
        .eq('tournament_id', tournament?.id)
        .order('match_date', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(mapMatchFromDb) as IMatch[];
    },
  });

  return (
    <Modal isOpen={isOpen} handleClose={handleClose} title="Новий прогноз" isForm PaperProps={PaperProps}>
      <div>
        <FormControl fullWidth margin="dense">
          <Autocomplete
            id="tournaments-list"
            value={tournament}
            inputValue={tournamentValue}
            onChange={(event: any, newValue: ITournament | null) => {
              setMatch(null);
              setMatchValue('');
              setTournament(newValue);
            }}
            onInputChange={(event, newInputValue) => {
              setTournamentValue(newInputValue);
            }}
            open={openTournament}
            onOpen={() => {
              setOpenTournament(true);
            }}
            onClose={() => {
              setOpenTournament(false);
            }}
            isOptionEqualToValue={(option: ITournament, value) => option.id === value.id}
            getOptionLabel={(option: ITournament) => option.name}
            options={tournaments}
            loading={isLoadingTournament}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Турнір"
                name="id"
                required
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <Fragment>
                      {isLoadingTournament ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </Fragment>
                  ),
                }}
              />
            )}
          />
        </FormControl>
        {tournament && (
          <>
            <FormControl fullWidth margin="dense">
              <Autocomplete
                id="users-list"
                value={user}
                inputValue={userValue}
                onChange={(event: any, newValue: IUser | null) => {
                  setUser(newValue);
                }}
                onInputChange={(event, newInputValue) => {
                  setUserValue(newInputValue);
                }}
                open={openUser}
                onOpen={() => {
                  setOpenUser(true);
                }}
                onClose={() => {
                  setOpenUser(false);
                }}
                isOptionEqualToValue={(option: IUser, value) => option.id === value.id}
                getOptionLabel={(option: IUser) => option.name}
                options={users}
                loading={isLoadingUsers}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Користувач"
                    name="id"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <Fragment>
                          {isLoadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </Fragment>
                      ),
                    }}
                  />
                )}
              />
            </FormControl>
            <FormControl fullWidth margin="dense">
              <Autocomplete
                id="match-list"
                value={match}
                inputValue={matchValue}
                onChange={(event: any, newValue: IMatch | null) => {
                  setMatch(newValue);
                }}
                onInputChange={(event, newInputValue) => {
                  setMatchValue(newInputValue);
                }}
                open={openMatch}
                onOpen={() => {
                  setOpenMatch(true);
                }}
                onClose={() => {
                  setOpenMatch(false);
                }}
                isOptionEqualToValue={(option: IMatch, value) => option.id === value.id}
                getOptionLabel={(option: IMatch) => option.homeTeam.name + ' - ' + option.awayTeam.name}
                options={data?.filter((match: IMatch) => match.status !== 'Finished')}
                loading={isLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Матч"
                    name="id"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <Fragment>
                          {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </Fragment>
                      ),
                    }}
                  />
                )}
              />
            </FormControl>
            <FormControl fullWidth margin="dense" required>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    id="homeScore"
                    name="homeScore"
                    label="Голи домашньої команди"
                    type="number"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    id="awayScore"
                    name="awayScore"
                    label="Голи виїздної команди"
                    type="number"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </FormControl>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CreatePredictModal;
