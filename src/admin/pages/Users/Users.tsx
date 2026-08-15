import {
  Checkbox,
  Paper,
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
import useSelection from '../../hooks/useSelection';
import { IUser } from '../../interfaces/user';
import { normalizeDate } from '../../helpers/date';
import { mapUserFromDb } from '../../helpers/mappers';

const createData = (
  id: string,
  name: string,
  nickname: string,
  email: string,
  phone: string,
  googleId: string,
  createdAt: string,
) => {
  return {
    id,
    name,
    nickname,
    email,
    phone,
    googleId,
    createdAt,
  };
};

const Users = () => {
  const { isLoading, data } = useQuery({
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
  const { isSelected, toggleSelection } = useSelection();

  if (isLoading) return <div>Loading...</div>;

  const rows = (data || []).map((user: IUser) =>
    createData(user.id, user.name, user.nickname || '', user.email, user.phone || '', user.googleId || '', user.createdAt),
  );

  return (
    <>
      <Typography variant="h1" fontSize={26} fontWeight={700} mb={2}>
        Користувачі
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Ім'я</TableCell>
              <TableCell>Нік</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Google</TableCell>
              <TableCell>Дата реєстрації</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row: IUser) => {
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
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.nickname}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell>{row.googleId ? 'Так' : 'Ні'}</TableCell>
                  <TableCell>{normalizeDate(row.createdAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default Users;
