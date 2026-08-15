import { useState } from 'react';
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
import CreateTeamModal from './components/CreateTeamModal';
import DeleteTeamModal from './components/DeleteTeamModal';
import { getTeamType } from '../../helpers/team';
import { normalizeDate } from '../../helpers/date';
import { ITeam } from '../../interfaces/team';
import EditTeamModal from './components/EditTeamModal';
import { Edit } from '@mui/icons-material';
import { mapTeamFromDb } from '../../helpers/mappers';
import ImportTeamsModal from './components/ImportTeamsModal';

function createData(
  id: number,
  apiTeamId: number | undefined,
  name: string,
  type: string,
  rank: number,
  logo?: string,
  createdAt?: string,
  updatedAt?: string,
) {
  return { id, apiTeamId, name, type, rank, logo, createdAt, updatedAt };
}

const Teams = () => {
  const [type, setType] = useState('all');

  const { selected, isSelected, toggleSelection, resetSelection } = useSelection();
  const { isOpen: createModalOpen, toggle: toggleCreateModal } = useModal();
  const {
    isOpen: editModalOpen,
    openModal: openEditModal,
    closeModal: closeEditModal,
    modalData: editModalData,
  } = useModal<ITeam>();
  const { isOpen: deleteModalOpen, toggle: toggleDeleteModal } = useModal();
  const { isOpen: importModalOpen, toggle: toggleImportModal } = useModal();

  const { isLoading, data } = useQuery({
    queryKey: ['teams', type],
    queryFn: async () => {
      let query = supabase.from('teams').select('*').order('created_at', { ascending: false });
      if (type !== 'all') {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(mapTeamFromDb) as ITeam[];
    },
  });

  const handleChange = (event: SelectChangeEvent<string>) => {
    setType(event.target.value);
  };

  if (isLoading) return <div>Loading...</div>;

  const rows = data.map((team: ITeam) =>
    createData(team.id, team.apiTeamId, team.name, team.type, team.rank, team.logo, team.createdAt, team.updatedAt),
  );

  return (
    <>
      <Typography variant="h1" fontSize={26} fontWeight={700} mb={2}>
        Команди
      </Typography>
      <Stack spacing={2} mb={2} direction="row">
        <FormControl style={{ width: '200px' }}>
          <InputLabel id="demo-simple-select-label">Фільтр по типу</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={type}
            label="Фільтр по типу"
            size="small"
            onChange={handleChange}>
            <MenuItem value="all">Усі</MenuItem>
            <MenuItem value="club">Клуб</MenuItem>
            <MenuItem value="national">Збірна</MenuItem>
          </Select>
        </FormControl>
        <Button onClick={toggleCreateModal} size="small" variant="contained">
          Створити нову команду
        </Button>
        <Button onClick={toggleImportModal} size="small" variant="outlined">
          Імпорт CSV
        </Button>
        {selected.length > 0 && (
          <Button variant="contained" size="small" onClick={toggleDeleteModal} color="error">
            Видалити команду
          </Button>
        )}
      </Stack>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Назва</TableCell>
              <TableCell align="right">API Team ID</TableCell>
              <TableCell align="right">Лого</TableCell>
              <TableCell align="right">Тип</TableCell>
              <TableCell align="right">FIFA рейтинг</TableCell>
              <TableCell align="right">Створено</TableCell>
              <TableCell align="right">Оновлено</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row: ITeam) => {
              const isItemSelected = isSelected(row.id);
              return (
                <TableRow
                  key={row.id}
                  selected={isItemSelected}
                  hover
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell padding="checkbox">
                    <Checkbox color="primary" onClick={() => toggleSelection(row.id)} checked={isItemSelected} />
                  </TableCell>
                  <TableCell component="th" scope="row" onClick={() => toggleSelection(row.id)}>
                    {row.name}
                  </TableCell>
                  <TableCell align="right">{row.apiTeamId || '-'}</TableCell>
                  <TableCell align="right" padding="none">
                    {row.logo && <img src={row.logo} width={32} height={32} alt={row.name} />}
                  </TableCell>
                  <TableCell align="right">{getTeamType(row.type)}</TableCell>
                  <TableCell align="right">{row.rank}</TableCell>
                  <TableCell align="right">{normalizeDate(row.createdAt)}</TableCell>
                  <TableCell align="right">{normalizeDate(row.updatedAt)}</TableCell>
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
      {createModalOpen && <CreateTeamModal createModalOpen={createModalOpen} toggleCreateModal={toggleCreateModal} />}
      {deleteModalOpen && (
        <DeleteTeamModal
          selected={selected}
          resetSelection={resetSelection}
          isOpen={deleteModalOpen}
          onClose={toggleDeleteModal}
        />
      )}
      {editModalOpen && (
        <EditTeamModal createModalOpen={editModalOpen} closeEditModal={closeEditModal} team={editModalData!} />
      )}
      {importModalOpen && <ImportTeamsModal isOpen={importModalOpen} onClose={toggleImportModal} />}
    </>
  );
};

export default Teams;
