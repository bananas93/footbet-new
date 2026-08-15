import { FC } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../../../components/Modal/Modal';
import { FormControl, Grid, TextField } from '@mui/material';
import { supabase } from '../../../helpers/supabase';
import { notify } from '../../../helpers/notify';
import { IPredict } from '../../../interfaces/predict';

interface Props {
  isOpen: boolean;
  handleClose: () => void;
  predict: IPredict;
}

const EditPredictModal: FC<Props> = ({ isOpen, handleClose, predict }) => {
  const PaperProps = {
    component: 'form',
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const formJson = Object.fromEntries((formData as any).entries());
      const data = {
        matchId: predict.match.id,
        userId: predict.user.id,
        tournamentId: predict.match.tournament?.id,
        homeScore: formJson.homeScore,
        awayScore: formJson.awayScore,
      };
      console.log(data);
      mutation.mutate(data);
    },
  };

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from('predictions').upsert(
        {
          match_id: formData.matchId,
          user_id: formData.userId,
          tournament_id: formData.tournamentId,
          home_score: Number(formData.homeScore),
          away_score: Number(formData.awayScore),
        },
        { onConflict: 'match_id,user_id' },
      );

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Прогноз успішно оновлено' };
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['predicts'] });
      notify.success(response.message);
      handleClose();
    },
    onError: (err: any) => {
      notify.error(err.message);
    },
  });

  return (
    <Modal isOpen={isOpen} handleClose={handleClose} title="Новий прогноз" isForm PaperProps={PaperProps}>
      <FormControl fullWidth margin="dense" required>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              id="homeScore"
              name="homeScore"
              label="Голи домашньої команди"
              type="number"
              variant="outlined"
              defaultValue={predict.homeScore}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              id="awayScore"
              name="awayScore"
              label="Голи виїздної команди"
              type="number"
              variant="outlined"
              defaultValue={predict.awayScore}
            />
          </Grid>
        </Grid>
      </FormControl>
    </Modal>
  );
};

export default EditPredictModal;
