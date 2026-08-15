import { FormControl, FormControlLabel, InputLabel, MenuItem, Select, Switch, TextField } from '@mui/material';
import { ITournament } from '../../../interfaces/tournament';
import { notify } from '../../../helpers/notify';
import Modal from '../../../components/Modal/Modal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../helpers/supabase';
import { useState } from 'react';
import { uploadLogoFile } from '../../../helpers/storage';

interface EditTournamentModalProps {
  tournament: ITournament;
  isOpen: boolean;
  onClose: () => void;
}

const EditTournamentModal: React.FC<EditTournamentModalProps> = ({ tournament, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [hasLogo, setHasLogo] = useState<boolean>(!!tournament.logo);

  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      let logo: string | null = hasLogo ? tournament.logo || null : null;
      const hasLogoFile = formData.logoFile instanceof File && formData.logoFile.size > 0;
      const isNationsLeague = !!formData.nationsLeagueFormat;

      if (hasLogoFile) {
        logo = await uploadLogoFile(formData.logoFile, 'tournaments');
      }

      const { error } = await supabase
        .from('tournaments')
        .update({
          name: formData.name,
          type: isNationsLeague ? 'national' : formData.type,
          is_nations_league: isNationsLeague,
          status: formData.status,
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
        })
        .eq('id', tournament.id);

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Турнір успішно оновлено' };
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      notify.success(response.message);
      onClose();
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
      const formJsonSwitch = {
        ...formJson,
        logoFile: formData.get('logoFile'),
        thirdPlaceMatch: formJson.thirdPlaceMatch === 'on' ? true : false,
        hasTable: formJson.hasTable === 'on' ? true : false,
        nationsLeagueFormat: formJson.nationsLeagueFormat === 'on' ? true : false,
      };
      mutation.mutate(formJsonSwitch);
    },
  };

  return (
    <Modal isOpen={isOpen} handleClose={onClose} title={`Редагувати ${tournament.name}`} isForm PaperProps={PaperProps}>
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
            defaultValue={tournament.name}
          />
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel id="type-label">Тип турніру</InputLabel>
          <Select labelId="type-label" id="type" label="Тип турніру" name="type" defaultValue={tournament.type}>
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
                defaultChecked={tournament.isNationsLeague}
                inputProps={{ 'aria-label': 'nations league preset' }}
              />
            }
            label="UEFA Nations League preset (A/B/C/D + плейоф Ліги A)"
          />
        </FormControl>
        <FormControl fullWidth margin="dense">
          <TextField
            required
            margin="dense"
            id="groupNumber"
            name="groupNumber"
            label="Кількість груп"
            type="number"
            fullWidth
            variant="outlined"
            defaultValue={tournament.groupNumber}
          />
        </FormControl>
        <FormControl fullWidth margin="dense">
          <TextField
            required
            margin="dense"
            id="groupMatchNumber"
            name="groupMatchNumber"
            label="Кількість матчів у групі"
            type="number"
            fullWidth
            variant="outlined"
            defaultValue={tournament.groupMatchNumber}
          />
        </FormControl>
        <FormControl fullWidth margin="dense">
          <TextField
            required
            margin="dense"
            id="knockoutRound"
            name="knockoutRound"
            label="Кількість матчів у плей-офф"
            type="number"
            fullWidth
            variant="outlined"
            defaultValue={tournament.knockoutRound}
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <TextField
            required
            margin="dense"
            id="directNextRound"
            name="directNextRound"
            label="Вихід команд у наступний раунд"
            type="number"
            fullWidth
            variant="outlined"
            defaultValue={tournament.directNextRound}
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <TextField
            required
            margin="dense"
            id="playoffRound"
            name="playoffRound"
            label="Вихід команд у стикові матчі"
            type="number"
            fullWidth
            variant="outlined"
            defaultValue={tournament.playoffRound}
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
            defaultValue={tournament.championsSlots || 0}
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
            defaultValue={tournament.europaSlots || 0}
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
            defaultValue={tournament.relegationSlots || 0}
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
                defaultChecked={tournament.thirdPlaceMatch}
                inputProps={{ 'aria-label': 'primary checkbox' }}
              />
            }
            label="Матч за 3 місце"
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <FormControlLabel
            control={
              <Switch
                id="hasTable"
                name="hasTable"
                defaultChecked={tournament.hasTable}
                color="primary"
                inputProps={{ 'aria-label': 'primary checkbox' }}
              />
            }
            label="Має таблицю"
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel id="status-label">Статус турніру</InputLabel>
          <Select
            labelId="status-label"
            id="status"
            label="Статус турніру"
            name="status"
            defaultValue={tournament.status}>
            <MenuItem value="scheduled">Запланований</MenuItem>
            <MenuItem value="live">В прогресі</MenuItem>
            <MenuItem value="completed">Завершений</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <TextField
            margin="dense"
            id="leagues"
            name="leagues"
            label="Кількість ліг"
            type="number"
            fullWidth
            defaultValue={tournament.leagues}
            variant="outlined"
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          {hasLogo && (
            <img src={tournament.logo} width={32} height={32} alt={tournament.name} style={{ marginBottom: 8 }} />
          )}
          {hasLogo && (
            <MenuItem onClick={() => setHasLogo(false)} sx={{ mb: 1 }}>
              Видалити поточне лого
            </MenuItem>
          )}
          <TextField
            margin="dense"
            id="logoFile"
            name="logoFile"
            label="Нове лого (опціонально)"
            type="file"
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ accept: 'image/*' }}
            variant="outlined"
          />
        </FormControl>
      </div>
    </Modal>
  );
};

export default EditTournamentModal;
