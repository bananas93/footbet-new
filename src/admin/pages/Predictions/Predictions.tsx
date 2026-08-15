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
import { supabase } from '../../helpers/supabase';
import { useQuery } from '@tanstack/react-query';
import { IPredict } from '../../interfaces/predict';
import useSelection from '../../hooks/useSelection';
import { IMatch } from '../../interfaces/match';
import useModal from '../../hooks/useModal';
import DeletePredictModal from './components/DeletePredictModal';
import CreatePredictModal from './components/CreatePredictModal';
import { Edit } from '@mui/icons-material';
import EditPredictModal from './components/EditPredictModal';
import { mapPredictFromDb } from '../../helpers/mappers';

const createData = (
  id: number,
  match: IMatch,
  user: {
    id: string;
    name: string;
  },
  homeScore: number,
  awayScore: number,
  points: number,
  correctScore: number,
  correctDifference: number,
  fivePlusGoals: number,
  correctResult: number,
) => {
  return {
    id,
    match,
    user,
    homeScore,
    awayScore,
    points,
    correctScore,
    correctDifference,
    fivePlusGoals,
    correctResult,
  };
};

const Predictions = () => {
  const { isLoading, data } = useQuery({
    queryKey: ['predicts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select(
          `
          id,
          home_score,
          away_score,
          points,
          correct_score,
          correct_difference,
          five_plus_goals,
          correct_result,
          user:profiles!predictions_user_id_fkey(id, name),
          match:matches!predictions_match_id_fkey(
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
            homeTeam:teams!matches_home_team_id_fkey(id, name),
            awayTeam:teams!matches_away_team_id_fkey(id, name)
          )
        `,
        )
        .order('id', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(mapPredictFromDb) as IPredict[];
    },
  });

  const { isOpen: createModalOpen, toggle: toggleCreateModal } = useModal();
  const { isOpen: deleteModalOpen, toggle: toggleDeleteModal } = useModal();
  const {
    isOpen: isEditModalOpen,
    openModal: openEditModal,
    closeModal: closeEditModal,
    modalData: editModalData,
  } = useModal<IPredict>();
  const { selected, isSelected, toggleSelection, resetSelection } = useSelection();

  if (isLoading) return <div>Loading...</div>;

  const rows = (data || []).map((predict: IPredict) =>
    createData(
      predict.id,
      predict.match,
      predict.user,
      predict.homeScore,
      predict.awayScore,
      predict.points,
      predict.correctScore,
      predict.correctDifference,
      predict.fivePlusGoals,
      predict.correctResult,
    ),
  );

  return (
    <>
      <Typography variant="h1" fontSize={26} fontWeight={700} mb={2}>
        Прогнози
      </Typography>
      <Stack spacing={2} mb={2} direction="row">
        <Button onClick={toggleCreateModal} size="small" variant="contained">
          Створити прогноз
        </Button>
        {selected.length > 0 && (
          <Button variant="contained" size="small" onClick={toggleDeleteModal} color="error">
            Видалити прогноз
          </Button>
        )}
      </Stack>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Юзер</TableCell>
              <TableCell>Матч</TableCell>
              <TableCell>Прогноз</TableCell>
              <TableCell>Результат</TableCell>
              <TableCell>Різниця</TableCell>
              <TableCell>5+ голів</TableCell>
              <TableCell>Точний рахунок</TableCell>
              <TableCell>Очок</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row: IPredict) => {
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
                  <TableCell>{row.user.name}</TableCell>
                  <TableCell component="th" scope="row">
                    {row.match.homeTeam.name} {row.match.status !== 'Scheduled' ? row.match.homeScore : ''} -{' '}
                    {row.match.status !== 'Scheduled' ? row.match.awayScore : ''} {row.match.awayTeam.name}
                  </TableCell>
                  <TableCell>{`${row.match.status !== 'Scheduled' ? row.homeScore : '?'} - ${
                    row.match.status !== 'Scheduled' ? row.awayScore : '?'
                  }`}</TableCell>
                  <TableCell>{row.correctResult}</TableCell>
                  <TableCell>{row.correctDifference}</TableCell>
                  <TableCell>{row.fivePlusGoals}</TableCell>
                  <TableCell>{row.correctScore}</TableCell>
                  <TableCell>{row.points}</TableCell>
                  <TableCell align="right">
                    {row.match.status !== 'Finished' && (
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => openEditModal(row)}
                        style={{ padding: 0 }}>
                        <Edit />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {createModalOpen && <CreatePredictModal isOpen={createModalOpen} handleClose={toggleCreateModal} />}
      {deleteModalOpen && (
        <DeletePredictModal
          selected={selected}
          resetSelection={resetSelection}
          isOpen={deleteModalOpen}
          onClose={toggleDeleteModal}
        />
      )}

      {isEditModalOpen && editModalData && (
        <EditPredictModal isOpen={isEditModalOpen} handleClose={closeEditModal} predict={editModalData} />
      )}
    </>
  );
};

export default Predictions;
