import { useQueryClient, useMutation } from '@tanstack/react-query';
import { FC } from 'react';
import { supabase } from '../../../helpers/supabase';
import Modal from '../../../components/Modal/Modal';
import { notify } from '../../../helpers/notify';

interface Props {
  selected: readonly (number | string)[];
  resetSelection: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const DeletePredictModal: FC<Props> = ({ selected, resetSelection, isOpen, onClose }: Props) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('predictions').delete().in('id', selected as number[]);
      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Прогнози успішно видалено' };
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['predicts'] });
      resetSelection();
      notify.success(response.message);
      onClose();
    },
    onError: (err: any) => {
      notify.error(err.message);
    },
  });

  const handleDelete = () => {
    mutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      handleClose={onClose}
      title="Видалення прогнозу"
      actionFunction={handleDelete}
      actionText="Видалити">
      Ви впевнені, що хочете видалити прогноз?
    </Modal>
  );
};

export default DeletePredictModal;
