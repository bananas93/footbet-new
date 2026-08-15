import { FC, Fragment, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Autocomplete,
  CircularProgress,
  FormControl,
  Grid,
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
import { MatchStageEnum, GROUP_TOUR_OPTIONS, IMatch, MatchStatus } from '../../../interfaces/match';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { notify } from '../../../helpers/notify';
import { mapTeamFromDb } from '../../../helpers/mappers';
import { getLeagueLabel, parseLeagueIndex } from '../../../helpers/league';
import { sendMatchUpdatePush } from '../../../helpers/push';

interface Props {
  isEditModalOpen: boolean;
  closeEditModal: () => void;
  tournaments: ITournament[];
  match: IMatch;
}

const EditMatchModal: FC<Props> = ({ isEditModalOpen, closeEditModal, tournaments, match }) => {
  const [tournament, setTournament] = useState(match.tournament.id);
  const handleChange = (event: SelectChangeEvent) => {
    setHomeTeam(null);
    setAwayTeam(null);
    setHomeTeamValue('');
    setAwayTeamValue('');
    setTournament(Number(event.target.value));
    setTournamentLeague('A');
  };

  const [openHomeTeams, setOpenHomeTeams] = useState(false);
  const [openAwayTeams, setOpenAwayTeams] = useState(false);

  const [homeTeam, setHomeTeam] = useState<ITeam | null>(match.homeTeam);
  const [homeTeamValue, setHomeTeamValue] = useState(match.homeTeam.name);

  const [awayTeam, setAwayTeam] = useState<ITeam | null>(match.awayTeam);
  const [awayTeamValue, setAwayTeamValue] = useState(match.awayTeam.name);

  const [stage, setStage] = useState(match.stage as string);
  const handleChangeStage = (event: SelectChangeEvent) => {
    setStage(event.target.value);
  };

  const [matchStatus, setMatchStatus] = useState(match.status as MatchStatus);
  const handleChangeStatus = (event: SelectChangeEvent) => {
    setMatchStatus(event.target.value as MatchStatus);
  };

  const [tournamentLeague, setTournamentLeague] = useState(getLeagueLabel(match.tournamentLeague || 1));

  const [matchDate, setMatchDate] = useState(dayjs(match.matchDate));

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
      const { error } = await supabase.from('matches').update(payload).eq('id', match.id);

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Матч успішно оновлено' };
    },
    onSuccess: async (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      notify.success(response.message);

      const selectedTournament = tournaments.find((item) => item.id === Number(variables.tournament_id));

      try {
        await sendMatchUpdatePush({
          tournamentId: Number(variables.tournament_id),
          tournamentName: selectedTournament?.name,
          homeTeamName: homeTeam?.name || match.homeTeam.name,
          awayTeamName: awayTeam?.name || match.awayTeam.name,
          previousHomeScore: match.homeScore,
          previousAwayScore: match.awayScore,
          homeScore: Number(variables.home_score),
          awayScore: Number(variables.away_score),
          status: String(variables.status),
        });
      } catch {
        notify.warning('Матч оновлено, але push-сповіщення не відправлено');
      }

      closeEditModal();
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
        group_tour: selectedGroupTour || null,
        group_name: (formJson.groupName as string) || null,
        api_fixture_id: formJson.apiFixtureId ? Number(formJson.apiFixtureId) : null,
        status: formJson.status,
        match_date: matchDate.toISOString(),
        tournament_id: Number(formJson.tournamentId),
        tournament_league: parseLeagueIndex(formJson.tournamentLeague, 1),
        home_team_id: homeTeam?.id,
        away_team_id: awayTeam?.id,
        home_score: matchStatus === 'Scheduled' ? 0 : Number(formJson.homeScore || match.homeScore || 0),
        away_score: matchStatus === 'Scheduled' ? 0 : Number(formJson.awayScore || match.awayScore || 0),
      };
      mutation.mutate(payload);
    },
  };

  const defaultGroupTour = GROUP_TOUR_OPTIONS.includes(match.groupTour as `${number} tour`) ? match.groupTour : '';

  return (
    <Modal isOpen={isEditModalOpen} handleClose={closeEditModal} title="Редагувати матч" isForm PaperProps={PaperProps}>
      <div>
        <FormControl fullWidth margin="dense">
          <InputLabel id="tournament-label">Турнір</InputLabel>
          <Select
            labelId="tournament-label"
            id="tournament"
            value={String(tournament)}
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
                id="home-teams-list"
                value={homeTeam as ITeam}
                inputValue={homeTeamValue as string}
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
                id="away-teams-list"
                value={awayTeam}
                inputValue={awayTeamValue}
                onChange={(event: any, newValue: ITeam | null) => {
                  setAwayTeam(newValue);
                }}
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
            {tournamentLeagues > 1 && (
              <FormControl fullWidth margin="dense" required>
                <InputLabel id="tournamentLeague-label">Ліга турніру</InputLabel>
                <Select
                  labelId="tournamentLeague-label"
                  id="tournamentLeague"
                  name="tournamentLeague"
                  label="Ліга турніру"
                  value={tournamentLeague}
                  onChange={(event) => setTournamentLeague(event.target.value)}>
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
            {stage === 'Group Stage' && (
              <>
                <FormControl fullWidth margin="dense" required={stage === 'Group Stage'}>
                  <InputLabel id="groupTour-label">Тур групи</InputLabel>
                  <Select
                    labelId="groupTour-label"
                    id="groupTour"
                    label="Тур групи"
                    defaultValue={defaultGroupTour}
                    required={stage === 'Group Stage'}
                    name="groupTour">
                    {GROUP_TOUR_OPTIONS.map((groupTour) => (
                      <MenuItem key={groupTour} value={groupTour}>
                        {groupTour}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="dense">
                  <TextField
                    id="groupName"
                    name="groupName"
                    label="Група"
                    placeholder="Наприклад: A, B3, C1"
                    defaultValue={match.groupName}
                  />
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
                defaultValue={match.apiFixtureId || ''}
              />
            </FormControl>
            <FormControl fullWidth margin="dense" required={stage === 'Group Stage'}>
              <DateTimePicker
                ampm={false}
                value={matchDate}
                onChange={(v) => setMatchDate(v || dayjs(match.matchDate))}
                minDate={dayjs(new Date())}
              />
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel id="status-label">Статус матча</InputLabel>
              <Select
                labelId="status-label"
                id="status"
                value={matchStatus}
                onChange={handleChangeStatus}
                label="Статус матча"
                name="status">
                <MenuItem value="Scheduled">Запланований</MenuItem>
                <MenuItem value="Live">Live</MenuItem>
                <MenuItem value="Finished">Завершений</MenuItem>
              </Select>
            </FormControl>
            {matchStatus !== 'Scheduled' && (
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
                      defaultValue={match.homeScore}
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
                      defaultValue={match.awayScore}
                    />
                  </Grid>
                </Grid>
              </FormControl>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default EditMatchModal;
