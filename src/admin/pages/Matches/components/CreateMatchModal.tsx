import { FC, Fragment, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Autocomplete,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import Modal from '../../../components/Modal/Modal';
import { supabase } from '../../../helpers/supabase';
import { ITournament } from '../../../interfaces/tournament';
import { ITeam } from '../../../interfaces/team';
import { MatchStageEnum, MatchGroupTour } from '../../../interfaces/match';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { notify } from '../../../helpers/notify';
import { mapTeamFromDb } from '../../../helpers/mappers';
import { getLeagueLabel, parseLeagueIndex } from '../../../helpers/league';

interface Props {
  createModalOpen: boolean;
  toggleCreateModal: () => void;
  tournaments: ITournament[];
}

const CreateMatchModal: FC<Props> = ({ createModalOpen, toggleCreateModal, tournaments }) => {
  const [tournament, setTournament] = useState('');
  const handleChange = (event: SelectChangeEvent) => {
    setHomeTeam(null);
    setAwayTeam(null);
    setHomeTeamValue('');
    setAwayTeamValue('');
    setTournament(event.target.value);
  };

  const [openHomeTeams, setOpenHomeTeams] = useState(false);
  const [openAwayTeams, setOpenAwayTeams] = useState(false);

  const [homeTeam, setHomeTeam] = useState<ITeam | null>(null);
  const [homeTeamValue, setHomeTeamValue] = useState('');

  const [awayTeam, setAwayTeam] = useState<ITeam | null>(null);
  const [awayTeamValue, setAwayTeamValue] = useState('');

  const [stage, setStage] = useState('');
  const handleChangeStage = (event: SelectChangeEvent) => {
    setStage(event.target.value);
  };

  const [matchDate, setMatchDate] = useState(dayjs(new Date()));

  const tournamentType = tournament ? tournaments.filter((item) => item.id === Number(tournament))[0].type : '';
  const tournamentLeagues = tournament ? tournaments.filter((item) => item.id === Number(tournament))[0].leagues : 1;

  const { isLoading, data } = useQuery({
    queryKey: ['teams', tournamentType],
    queryFn: async () => {
      if (!tournamentType) return [];
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, type, rank, logo, created_at, updated_at')
        .eq('type', tournamentType)
        .order('name', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(mapTeamFromDb) as ITeam[];
    },
  });

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from('matches').insert(payload);

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Матч успішно створено' };
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      notify.success(response.message);
      toggleCreateModal();
    },
    onError: (err: any) => {
      notify.error(err.message);
    },
  });

  const PaperProps = {
    component: 'form',
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const formJson = Object.fromEntries((formData as any).entries());
      const selectedGroupTour = formJson.groupTour as string | undefined;

      const payload = {
        stage: formJson.stage,
        group_tour: selectedGroupTour ? MatchGroupTour[selectedGroupTour as keyof typeof MatchGroupTour] : null,
        group_name: (formJson.groupName as string) || null,
        api_fixture_id: formJson.apiFixtureId ? Number(formJson.apiFixtureId) : null,
        status: 'Scheduled',
        match_date: matchDate.toISOString(),
        tournament_id: Number(formJson.tournamentId),
        tournament_league: parseLeagueIndex(formJson.tournamentLeague, 1),
        home_team_id: homeTeam?.id,
        away_team_id: awayTeam?.id,
        home_score: 0,
        away_score: 0,
      };
      mutation.mutate(payload);
    },
  };

  return (
    <Modal isOpen={createModalOpen} handleClose={toggleCreateModal} title="Новий матч" isForm PaperProps={PaperProps}>
      <div>
        <FormControl fullWidth margin="dense">
          <InputLabel id="tournament-label">Турнір</InputLabel>
          <Select
            labelId="tournament-label"
            id="tournament"
            value={tournament}
            label="Турнір"
            onChange={handleChange}
            name="tournamentId">
            {tournaments.map((tournament) => (
              <MenuItem key={tournament.id} value={tournament.id}>
                {tournament.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {tournament && (
          <>
            <FormControl fullWidth margin="dense">
              <Autocomplete
                id="teams-list"
                value={homeTeam}
                inputValue={homeTeamValue}
                onChange={(event: any, newValue: ITeam | null) => {
                  setHomeTeam(newValue);
                }}
                onInputChange={(event, newInputValue) => {
                  setHomeTeamValue(newInputValue);
                }}
                open={openHomeTeams}
                onOpen={() => {
                  setOpenHomeTeams(true);
                }}
                onClose={() => {
                  setOpenHomeTeams(false);
                }}
                getOptionDisabled={(option: ITeam) => option.id === awayTeam?.id}
                isOptionEqualToValue={(option: ITeam, value) => option.id === value.id}
                getOptionLabel={(option: ITeam) => option.name}
                options={data || []}
                loading={isLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Домашня команда"
                    name="homeTeamId"
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
            <FormControl fullWidth margin="dense">
              <Autocomplete
                id="teams-list"
                value={awayTeam}
                onChange={(event: any, newValue: ITeam | null) => {
                  setAwayTeam(newValue);
                }}
                inputValue={awayTeamValue}
                onInputChange={(event, newInputValue) => {
                  setAwayTeamValue(newInputValue);
                }}
                open={openAwayTeams}
                onOpen={() => {
                  setOpenAwayTeams(true);
                }}
                onClose={() => {
                  setOpenAwayTeams(false);
                }}
                getOptionDisabled={(option: ITeam) => option.id === homeTeam?.id}
                isOptionEqualToValue={(option: ITeam, value) => option.id === value.id}
                getOptionLabel={(option: ITeam) => option.name}
                options={data || []}
                loading={isLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Виїздна команда"
                    name="awayTeamId"
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
            {tournamentLeagues > 1 && (
              <FormControl fullWidth margin="dense">
                <InputLabel id="tournamentLeague-label">Ліга турніру</InputLabel>
                <Select
                  labelId="tournamentLeague-label"
                  id="tournamentLeague"
                  name="tournamentLeague"
                  label="Ліга турніру"
                  defaultValue="A"
                  required>
                  {Array.from({ length: tournamentLeagues }, (_, index) => {
                    const label = getLeagueLabel(index + 1);
                    return (
                      <MenuItem key={label} value={label}>
                        {`Ліга ${label}`}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth margin="dense" required>
              <InputLabel id="stage-label">Етап</InputLabel>
              <Select
                labelId="stage-label"
                onChange={handleChangeStage}
                value={stage}
                id="stage"
                label="Етап"
                required
                name="stage">
                {Object.entries(MatchStageEnum).map((stage) => (
                  <MenuItem key={stage[0]} value={stage[1]}>
                    {stage[1]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {stage === 'Group Stage' && (
              <>
                <FormControl fullWidth margin="dense" required={stage === 'Group Stage'}>
                  <InputLabel id="groupTour-label">Тур групи</InputLabel>
                  <Select
                    labelId="groupTour-label"
                    id="groupTour"
                    label="Тур групи"
                    required={stage === 'Group Stage'}
                    name="groupTour">
                    {Object.entries(MatchGroupTour).map((stage) => (
                      <MenuItem key={stage[0]} value={stage[0]}>
                        {stage[1]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="dense">
                  <TextField id="groupName" name="groupName" label="Група" placeholder="Наприклад: A, B3, C1" />
                </FormControl>
              </>
            )}
            <FormControl fullWidth margin="dense">
              <TextField
                fullWidth
                id="apiFixtureId"
                name="apiFixtureId"
                label="API-Football Fixture ID (опціонально)"
                type="number"
                variant="outlined"
              />
            </FormControl>
            <FormControl fullWidth margin="dense" required={stage === 'GROUP_STAGE'}>
              <DateTimePicker ampm={false} value={matchDate} onChange={(v) => setMatchDate(v || dayjs(new Date()))} minDate={dayjs(new Date())} />
            </FormControl>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CreateMatchModal;
