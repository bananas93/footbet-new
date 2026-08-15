import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../helpers/supabase';
import useSelection from '../../hooks/useSelection';
import useModal from '../../hooks/useModal';
import DeleteMatchModal from './components/DeleteMatchModal';
import CreateMatchModal from './components/CreateMatchModal';
import { ITournament } from '../../interfaces/tournament';
import { IMatch } from '../../interfaces/match';
import { normalizeMatchDate } from '../../helpers/date';
import EditMatchModal from './components/EditMatchModal';
import { Edit } from '@mui/icons-material';
import { ITeam } from '../../interfaces/team';
import { mapMatchFromDb, mapTournamentOptionFromDb } from '../../helpers/mappers';
import ImportMatchesModal from './components/ImportMatchesModal';
import { getLeagueLabel } from '../../helpers/league';

function createData(
  id: number,
  apiFixtureId: number | undefined,
  homeTeam: ITeam,
  awayTeam: ITeam,
  groupName: string,
  groupTour: string,
  tournament: ITournament,
  tournamentLeague: number,
  homeScore: number,
  awayScore: number,
  matchDate: string,
  stage: string,
  status: string,
) {
  return {
    id,
    apiFixtureId,
    homeTeam,
    awayTeam,
    groupName,
    groupTour,
    tournament,
    tournamentLeague,
    homeScore,
    awayScore,
    matchDate,
    stage,
    status,
  };
}

const Matches = () => {
  const [tournaments, setTournaments] = useState<ITournament[]>([]);
  const [tournament, setTournament] = useState('all');

  const { selected, isSelected, toggleSelection, resetSelection } = useSelection();
  const { isOpen: createModalOpen, toggle: toggleCreateModal } = useModal();
  const { isOpen: deleteModalOpen, toggle: toggleDeleteModal } = useModal();
  const {
    isOpen: isEditModalOpen,
    openModal: openEditModal,
    closeModal: closeEditModal,
    modalData: editModalData,
  } = useModal<IMatch>();
  const { isOpen: importModalOpen, toggle: toggleImportModal } = useModal();

  const { isLoading, data } = useQuery({
    queryKey: ['matches', tournament],
    queryFn: async () => {
      let query = supabase
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
          tournament:tournaments(id, name),
          homeTeam:teams!matches_home_team_id_fkey(id, api_team_id, name, logo),
          awayTeam:teams!matches_away_team_id_fkey(id, api_team_id, name, logo)
        `,
        )
        .order('match_date', { ascending: true });

      if (tournament !== 'all') {
        query = query.eq('tournament_id', Number(tournament));
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(mapMatchFromDb) as IMatch[];
    },
  });

  const getTournamentType = async () => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, type, leagues')
      .order('created_at', { ascending: false });

    if (!error) {
      setTournaments((data || []).map(mapTournamentOptionFromDb) as ITournament[]);
    }
  };

  useEffect(() => {
    getTournamentType();
  }, []);

  const handleChange = (event: SelectChangeEvent<string>) => {
    setTournament(event.target.value);
  };

  if (isLoading) return <div>Loading...</div>;

  const rows = (data || []).map((match: IMatch) =>
    createData(
      match.id,
      match.apiFixtureId,
      match.homeTeam,
      match.awayTeam,
      match.groupName,
      match.groupTour,
      match.tournament,
      match.tournamentLeague,
      match.homeScore,
      match.awayScore,
      match.matchDate,
      match.stage,
      match.status,
    ),
  );

  const tournamentsList =
    tournaments?.map((tournament: any) => (
      <MenuItem key={tournament.id} value={tournament.id}>
        {tournament.name}
      </MenuItem>
    )) ?? [];

  return (
    <>
      <Typography variant="h1" fontSize={26} fontWeight={700} mb={2}>
        Матчі
      </Typography>
      <Stack spacing={2} mb={2} direction="row">
        <FormControl style={{ width: '300px' }}>
          <InputLabel id="tournament-label">Фільтр по турніру</InputLabel>
          <Select
            labelId="tournament-label"
            id="tournament-select"
            value={tournament}
            label="Фільтр по турніру"
            size="small"
            onChange={handleChange}>
            <MenuItem value="all">Усі</MenuItem>
            {tournamentsList}
          </Select>
        </FormControl>
        <Button onClick={toggleCreateModal} size="small" variant="contained">
          Створити новий матч
        </Button>
        <Button onClick={toggleImportModal} size="small" variant="outlined">
          Імпорт CSV
        </Button>
        {selected.length > 0 && (
          <Button variant="contained" size="small" onClick={toggleDeleteModal} color="error">
            Видалити матч
          </Button>
        )}
      </Stack>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Вдома</TableCell>
              <TableCell>Виїзд</TableCell>
              <TableCell>Рахунок</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell>Етап</TableCell>
              <TableCell>API Fixture ID</TableCell>
              <TableCell>Ліга</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Група</TableCell>
              <TableCell>Турнір</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row: IMatch) => {
              const isItemSelected = isSelected(row.id);
              return (
                <TableRow
                  key={row.id}
                  selected={isItemSelected}
                  onClick={() => toggleSelection(row.id)}
                  hover
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell padding="checkbox">
                    <Checkbox color="primary" checked={isItemSelected} />
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {row.homeTeam.name}
                  </TableCell>
                  <TableCell>{row.awayTeam.name}</TableCell>
                  <TableCell>{row.status === 'Scheduled' ? '- : -' : `${row.homeScore} - ${row.awayScore}`}</TableCell>
                  <TableCell>{normalizeMatchDate(row.matchDate)}</TableCell>
                  <TableCell>{row.stage}</TableCell>
                  <TableCell>{row.apiFixtureId || '-'}</TableCell>
                  <TableCell>{`Ліга ${getLeagueLabel(row.tournamentLeague)}`}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.groupName}</TableCell>
                  <TableCell>{row.tournament.name}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" size="small" onClick={() => openEditModal(row)}>
                      <Edit />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {createModalOpen && (
        <CreateMatchModal
          createModalOpen={createModalOpen}
          toggleCreateModal={toggleCreateModal}
          tournaments={tournaments}
        />
      )}
      {deleteModalOpen && (
        <DeleteMatchModal
          selected={selected}
          resetSelection={resetSelection}
          isOpen={deleteModalOpen}
          onClose={toggleDeleteModal}
        />
      )}
      {isEditModalOpen && (
        <EditMatchModal
          isEditModalOpen={isEditModalOpen}
          closeEditModal={closeEditModal}
          tournaments={tournaments}
          match={editModalData!}
        />
      )}
      {importModalOpen && <ImportMatchesModal isOpen={importModalOpen} onClose={toggleImportModal} tournaments={tournaments} />}
    </>
  );
};

export default Matches;
