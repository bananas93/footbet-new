import { FC } from 'react';
import Modal from '../../../components/Modal/Modal';
import { FormControl, FormControlLabel, InputLabel, MenuItem, Select, Switch, TextField } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../helpers/supabase';
import { notify } from '../../../helpers/notify';
import { uploadLogoFile } from '../../../helpers/storage';

interface Props {
  createModalOpen: boolean;
  toggleCreateModal: () => void;
}

const CreateTournamentModal: FC<Props> = ({ createModalOpen, toggleCreateModal }) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (formData: Record<string, any>) => {
      const hasLogoFile = formData.logoFile instanceof File && formData.logoFile.size > 0;
      const logo = hasLogoFile ? await uploadLogoFile(formData.logoFile, 'tournaments') : null;
      const isNationsLeague = !!formData.nationsLeagueFormat;

      const payload = {
        name: formData.name,
        type: isNationsLeague ? 'national' : formData.type,
        is_nations_league: isNationsLeague,
        group_number: isNationsLeague ? 14 : Number(formData.groupNumber || 0),
        group_match_number: isNationsLeague ? 6 : Number(formData.groupMatchNumber || 0),
        knockout_round: isNationsLeague ? 3 : Number(formData.knockoutRound || 0),
        direct_next_round: isNationsLeague ? 1 : Number(formData.directNextRound || 0),
        playoff_round: isNationsLeague ? 0 : Number(formData.playoffRound || 0),
        champions_slots: isNationsLeague ? 0 : Number(formData.championsSlots || formData.directNextRound || 0),
        europa_slots: isNationsLeague ? 0 : Number(formData.europaSlots || formData.playoffRound || 0),
        relegation_slots: isNationsLeague ? 0 : Number(formData.relegationSlots || 0),
        third_place_match: isNationsLeague ? true : !!formData.thirdPlaceMatch,
        has_table: !!formData.hasTable,
        leagues: isNationsLeague ? 4 : Number(formData.leagues || 1),
        logo,
        status: 'scheduled',
      };

      const { error } = await supabase.from('tournaments').insert(payload);

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Турнір успішно створено' };
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
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
        thirdPlaceMatch: formJson.thirdPlaceMatch === 'on',
        hasTable: formJson.hasTable === 'on',
        nationsLeagueFormat: formJson.nationsLeagueFormat === 'on',
      });
    },
  };

  return (
    <Modal isOpen={createModalOpen} handleClose={toggleCreateModal} title="Новий турнір" isForm PaperProps={PaperProps}>
      <div>
        <FormControl fullWidth margin="dense">
          <TextField
            autoFocus
            required
            margin="dense"
            id="name"
            name="name"
            label="Назва турніру"
            type="text"
            fullWidth
            variant="outlined"
          />
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel id="type-label">Тип турніру</InputLabel>
          <Select labelId="type-label" id="type" label="Тип турніру" name="type" defaultValue="club">
            <MenuItem value="club">Клубний</MenuItem>
            <MenuItem value="national">Збірні</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <FormControlLabel
            control={
              <Switch
                id="nationsLeagueFormat"
                name="nationsLeagueFormat"
                color="primary"
                defaultChecked={false}
                inputProps={{ 'aria-label': 'nations league preset' }}
              />
            }
            label="UEFA Nations League preset (A/B/C/D + плейоф Ліги A)"
          />
        </FormControl>
        <FormControl fullWidth margin="dense">
          <TextField
            margin="dense"
            id="groupNumber"
            name="groupNumber"
            label="Кількість груп"
            type="number"
            fullWidth
            defaultValue={0}
            variant="outlined"
          />
        </FormControl>
        <FormControl fullWidth margin="dense">
          <TextField
            margin="dense"
            id="groupMatchNumber"
            name="groupMatchNumber"
            label="Кількість матчів у групі"
            type="number"
            fullWidth
            defaultValue={0}
            variant="outlined"
          />
        </FormControl>
        <FormControl fullWidth margin="dense">
          <TextField
            margin="dense"
            id="knockoutRound"
            name="knockoutRound"
            label="Кількість матчів у плей-офф"
            type="number"
            fullWidth
            defaultValue={0}
            variant="outlined"
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <TextField
            margin="dense"
            id="directNextRound"
            name="directNextRound"
            label="Вихід команд у наступний раунд"
            type="number"
            fullWidth
            defaultValue={0}
            variant="outlined"
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <TextField
            margin="dense"
            id="playoffRound"
            name="playoffRound"
            label="Вихід команд у стикові матчі"
            type="number"
            fullWidth
            defaultValue={0}
            variant="outlined"
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <TextField
            margin="dense"
            id="championsSlots"
            name="championsSlots"
            label="Слоти Champions League"
            type="number"
            fullWidth
            defaultValue={0}
            variant="outlined"
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <TextField
            margin="dense"
            id="europaSlots"
            name="europaSlots"
            label="Слоти Europe League"
            type="number"
            fullWidth
            defaultValue={0}
            variant="outlined"
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <TextField
            margin="dense"
            id="relegationSlots"
            name="relegationSlots"
            label="Кількість команд на виліт"
            type="number"
            fullWidth
            defaultValue={0}
            variant="outlined"
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <FormControlLabel
            control={
              <Switch
                id="thirdPlaceMatch"
                name="thirdPlaceMatch"
                color="primary"
                inputProps={{ 'aria-label': 'primary checkbox' }}
              />
            }
            label="Матч за 3 місце"
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <FormControlLabel
            control={
              <Switch id="hasTable" name="hasTable" color="primary" inputProps={{ 'aria-label': 'primary checkbox' }} />
            }
            label="Має таблицю"
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <TextField
            margin="dense"
            id="leagues"
            name="leagues"
            label="Кількість ліг"
            type="number"
            fullWidth
            defaultValue={1}
            variant="outlined"
          />
        </FormControl>
        <FormControl fullWidth margin="dense">
          <TextField
            margin="dense"
            id="logoFile"
            name="logoFile"
            label="Лого (опціонально)"
            type="file"
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ accept: 'image/*' }}
          />
        </FormControl>
      </div>
    </Modal>
  );
};

export default CreateTournamentModal;
