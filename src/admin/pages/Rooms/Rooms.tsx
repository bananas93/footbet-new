import { useState } from 'react';
import {
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../helpers/supabase';
import useSelection from '../../hooks/useSelection';
import { notify } from '../../helpers/notify';
import { IAdminRoom, mapRoomFromDb } from '../../helpers/mappers';

const Rooms = () => {
  const queryClient = useQueryClient();
  const { selected, isSelected, toggleSelection, resetSelection } = useSelection();

  const [name, setName] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [password, setPassword] = useState('');

  const { isLoading, data } = useQuery({
    queryKey: ['rooms-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select(
          `
          id,
          name,
          type,
          invite_code,
          creator:profiles!rooms_creator_id_fkey(name),
          room_members(user_id)
        `,
        )
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(mapRoomFromDb) as IAdminRoom[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('create_room', {
        p_name: name,
        p_type: type,
        p_password: type === 'private' ? password : null,
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms-admin'] });
      setName('');
      setPassword('');
      notify.success('Кімнату створено');
    },
    onError: (err: any) => notify.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('rooms').delete().in('id', selected as number[]);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms-admin'] });
      resetSelection();
      notify.success('Кімнати видалено');
    },
    onError: (err: any) => notify.error(err.message),
  });

  const handleCreate = () => {
    if (!name.trim()) {
      notify.error('Вкажіть назву кімнати');
      return;
    }

    if (type === 'private' && !password.trim()) {
      notify.error('Для private кімнати потрібен пароль');
      return;
    }

    createMutation.mutate();
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <Typography variant="h1" fontSize={26} fontWeight={700} mb={2}>
        Кімнати
      </Typography>

      <Stack spacing={2} mb={2} direction="row" alignItems="center">
        <TextField label="Назва кімнати" size="small" value={name} onChange={(e) => setName(e.target.value)} />
        <FormControl size="small" style={{ minWidth: 160 }}>
          <InputLabel id="room-type-label">Тип</InputLabel>
          <Select labelId="room-type-label" value={type} label="Тип" onChange={(e) => setType(e.target.value as any)}>
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </Select>
        </FormControl>
        {type === 'private' && (
          <TextField
            label="Пароль"
            size="small"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
        <Button variant="contained" onClick={handleCreate}>
          Створити кімнату
        </Button>
        {selected.length > 0 && (
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate()}>
            Видалити вибрані
          </Button>
        )}
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Назва</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Creator</TableCell>
              <TableCell>Учасників</TableCell>
              <TableCell>Invite code</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data || []).map((room: IAdminRoom) => {
              const selectedRow = isSelected(room.id);
              return (
                <TableRow key={room.id} selected={selectedRow} hover onClick={() => toggleSelection(room.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedRow} />
                  </TableCell>
                  <TableCell>{room.name}</TableCell>
                  <TableCell>{room.type}</TableCell>
                  <TableCell>{room.creator}</TableCell>
                  <TableCell>{room.members}</TableCell>
                  <TableCell>{room.inviteCode}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default Rooms;
