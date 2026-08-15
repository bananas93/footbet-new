import { FC } from 'react';
import Modal from '../../../components/Modal/Modal';
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../helpers/supabase';
import { notify } from '../../../helpers/notify';
import { uploadLogoFile } from '../../../helpers/storage';

interface Props {
  createModalOpen: boolean;
  toggleCreateModal: () => void;
}

const CreateTeamModal: FC<Props> = ({ createModalOpen, toggleCreateModal }) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      const hasLogoFile = formData.logoFile instanceof File && formData.logoFile.size > 0;
      const logo = hasLogoFile ? await uploadLogoFile(formData.logoFile, 'teams') : null;

      const { error } = await supabase.from('teams').insert({
        api_team_id: formData.apiTeamId ? Number(formData.apiTeamId) : null,
        name: formData.name,
        type: formData.type,
        rank: Number(formData.rank || 0),
        logo,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Команду успішно створено' };
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
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
      mutation.mutate({
        ...formJson,
        logoFile: formData.get('logoFile'),
      });
    },
  };

  return (
    <Modal isOpen={createModalOpen} handleClose={toggleCreateModal} title="Нова команда" isForm PaperProps={PaperProps}>
      <div>
        <FormControl fullWidth margin="dense">
          <TextField
            fullWidth
            id="apiTeamId"
            name="apiTeamId"
            label="API-Football Team ID (опціонально)"
            type="number"
            variant="outlined"
          />
        </FormControl>
        <FormControl fullWidth margin="dense">
          <TextField
            autoFocus
            required
            margin="dense"
            id="name"
            name="name"
            label="Назва клубу"
            type="text"
            fullWidth
            variant="outlined"
          />
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel id="type-label">Тип команди</InputLabel>
          <Select labelId="type-label" id="type" label="Тип турніру" name="type">
            <MenuItem value="club">Клуб</MenuItem>
            <MenuItem value="national">Збірна</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <TextField fullWidth id="rank" name="rank" label="Fifa рейтинг" type="number" variant="outlined" />
        </FormControl>
        <FormControl fullWidth margin="dense">
          <TextField
            fullWidth
            id="logoFile"
            name="logoFile"
            label="Лого (опціонально)"
            type="file"
            InputLabelProps={{ shrink: true }}
            inputProps={{ accept: 'image/*' }}
          />
        </FormControl>
      </div>
    </Modal>
  );
};

export default CreateTeamModal;
