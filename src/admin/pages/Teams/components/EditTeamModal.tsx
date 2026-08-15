import { FC, useState } from 'react';
import Modal from '../../../components/Modal/Modal';
import { FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../helpers/supabase';
import { ITeam } from '../../../interfaces/team';
import { Edit } from '@mui/icons-material';
import { notify } from '../../../helpers/notify';
import { uploadLogoFile } from '../../../helpers/storage';

interface Props {
  createModalOpen: boolean;
  closeEditModal: () => void;
  team: ITeam;
}

const EditTeamModal: FC<Props> = ({ createModalOpen, closeEditModal, team }) => {
  const queryClient = useQueryClient();
  const [hasLogo, setHasLogo] = useState<boolean>(!!team.logo);

  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      let logo: string | null = hasLogo ? team.logo || null : null;
      const hasLogoFile = formData.logoFile instanceof File && formData.logoFile.size > 0;

      if (hasLogoFile) {
        logo = await uploadLogoFile(formData.logoFile, 'teams');
      }

      const { error } = await supabase
        .from('teams')
        .update({
          api_team_id: formData.apiTeamId ? Number(formData.apiTeamId) : null,
          name: formData.name,
          type: formData.type,
          rank: Number(formData.rank || 0),
          logo,
        })
        .eq('id', team.id);

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Команду успішно оновлено' };
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      notify.success(response.message);
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
      mutation.mutate({
        ...formJson,
        logoFile: formData.get('logoFile'),
      });
    },
  };

  const removeLogo = () => {
    setHasLogo(false);
  };

  return (
    <Modal
      isOpen={createModalOpen}
      handleClose={closeEditModal}
      title={`Редагувати ${team.name}`}
      isForm
      PaperProps={PaperProps}>
      <div>
        <FormControl fullWidth margin="dense">
          <TextField
            fullWidth
            id="apiTeamId"
            name="apiTeamId"
            label="API-Football Team ID (опціонально)"
            type="number"
            variant="outlined"
            defaultValue={team.apiTeamId || ''}
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
            defaultValue={team.name}
          />
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel id="type-label">Тип команди</InputLabel>
          <Select labelId="type-label" id="type" label="Тип турніру" name="type" defaultValue={team.type}>
            <MenuItem value="club">Клуб</MenuItem>
            <MenuItem value="national">Збірна</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <TextField
            fullWidth
            id="rank"
            name="rank"
            label="Fifa рейтинг"
            type="number"
            variant="outlined"
            defaultValue={team.rank || 0}
          />
        </FormControl>
        <FormControl fullWidth margin="dense">
          {hasLogo ? (
            <Stack direction="row" gap={2}>
              <img src={team.logo} width={32} height={32} alt={team.name} />
              <span>
                <IconButton color="primary" size="small" onClick={removeLogo}>
                  <Edit />
                </IconButton>
              </span>
            </Stack>
          ) : null}
          <TextField
            fullWidth
            id="logoFile"
            name="logoFile"
            label="Нове лого (опціонально)"
            type="file"
            InputLabelProps={{ shrink: true }}
            inputProps={{ accept: 'image/*' }}
          />
        </FormControl>
      </div>
    </Modal>
  );
};

export default EditTeamModal;
