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

const DeleteTeamModal: FC<Props> = ({ selected, resetSelection, isOpen, onClose }: Props) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('teams').delete().in('id', selected as number[]);
      if (error) {
        throw new Error(error.message);
      }
      return { message: 'Команди успішно видалено' };
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      notify.success(response.message);
      resetSelection();
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
      title="Видалення команди"
      actionFunction={handleDelete}
      actionText="Видалити">
      Ви впевнені, що хочете видалити команду?
    </Modal>
  );
};

export default DeleteTeamModal;
