import {
  Button,
  Checkbox,
  IconButton,
  Paper,
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
import { ITournament } from '../../interfaces/tournament';
import { getTournamentStatus, getTournamentType } from '../../helpers/tournament';
import CreateTournamentModal from './components/CreateTournamentModal';
import DeleteTournamentModal from './components/DeleteTournamentModal';
import useSelection from '../../hooks/useSelection';
import useModal from '../../hooks/useModal';
import EditTournamentModal from './components/EditTournamentModal';
import { Edit } from '@mui/icons-material';
import { mapTournamentFromDb } from '../../helpers/mappers';

function createData(
  id: number,
  name: string,
  groupNumber: number,
  groupMatchNumber: number,
  knockoutRound: number,
  type: string,
  status: string,
  leagues: number,
  thirdPlaceMatch: boolean,
  hasTable: boolean,
  logo?: string,
  createdAt?: string,
  updatedAt?: string,
) {
  return {
    id,
    name,
    groupNumber,
    groupMatchNumber,
    knockoutRound,
    type,
    status,
    leagues,
    thirdPlaceMatch,
    hasTable,
    logo,
    createdAt,
    updatedAt,
  };
}

const Tournaments = () => {
  const { selected, isSelected, toggleSelection, resetSelection } = useSelection();
  const { isOpen: createModalOpen, toggle: toggleCreateModal } = useModal();
  const { isOpen: deleteModalOpen, toggle: toggleDeleteModal } = useModal();
  const {
    isOpen: editModalOpen,
    openModal: openEditModal,
    closeModal: closeEditModal,
    modalData: editModalData,
  } = useModal<ITournament>();

  const { isLoading, data } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(mapTournamentFromDb) as ITournament[];
    },
  });

  if (isLoading) return <div>Loading...</div>;

  const rows = data.map((tournament: ITournament) =>
    createData(
      tournament.id,
      tournament.name,
      tournament.groupNumber,
      tournament.groupMatchNumber,
      tournament.knockoutRound,
      tournament.type,
      tournament.status,
      tournament.leagues,
      tournament.thirdPlaceMatch,
      tournament.hasTable,
      tournament.logo,
      tournament.createdAt,
      tournament.updatedAt,
    ),
  );

  return (
    <>
      <Typography variant="h1" fontSize={26} fontWeight={700} mb={2}>
        Турніри
      </Typography>
      <Stack spacing={2} mb={2} direction="row">
        <Button onClick={toggleCreateModal} variant="contained">
          Створити новий турнір
        </Button>
        {selected.length > 0 && (
          <Button variant="contained" onClick={toggleDeleteModal} color="error">
            Видалити турнір
          </Button>
        )}
      </Stack>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Назва</TableCell>
              <TableCell align="right">Кількість груп</TableCell>
              <TableCell align="right">Матчів в групі</TableCell>
              <TableCell align="right">Матчів в плейофф</TableCell>
              <TableCell align="right">Тип</TableCell>
              <TableCell align="right">Статус</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row: ITournament) => {
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
                    {row.name}
                  </TableCell>
                  <TableCell align="right">{row.groupNumber}</TableCell>
                  <TableCell align="right">{row.groupMatchNumber}</TableCell>
                  <TableCell align="right">{row.knockoutRound}</TableCell>
                  <TableCell align="right">{getTournamentType(row.type)}</TableCell>
                  <TableCell align="right">{getTournamentStatus(row.status)}</TableCell>
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
        <CreateTournamentModal createModalOpen={createModalOpen} toggleCreateModal={toggleCreateModal} />
      )}
      {deleteModalOpen && (
        <DeleteTournamentModal
          onClose={toggleDeleteModal}
          isOpen={deleteModalOpen}
          selected={selected}
          resetSelection={resetSelection}
        />
      )}

      {editModalOpen && (
        <EditTournamentModal isOpen={editModalOpen} onClose={closeEditModal} tournament={editModalData!} />
      )}
    </>
  );
};

export default Tournaments;
