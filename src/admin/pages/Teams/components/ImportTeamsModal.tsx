import { FC, useMemo, useState } from 'react';
import { Box, FormControl, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../../../components/Modal/Modal';
import { parseCsvText } from '../../../helpers/csv';
import { notify } from '../../../helpers/notify';
import { supabase } from '../../../helpers/supabase';

type TeamType = 'club' | 'national';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const parseTeamType = (raw: string): TeamType | null => {
  const value = raw.trim().toLowerCase();
  if (value === 'club' || value === 'клуб') return 'club';
  if (value === 'national' || value === 'збірна' || value === 'sbirna') return 'national';
  return null;
};

const ImportTeamsModal: FC<Props> = ({ isOpen, onClose }) => {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const queryClient = useQueryClient();

  const validRows = useMemo(() => {
    return rows
      .map((row, index) => {
        const name = row.name?.trim();
        const type = parseTeamType(row.type || '');
        const rank = Number(row.rank || 0);
        const logo = row.logo?.trim() || null;
        const apiTeamIdRaw = row.api_team_id || row.apiteamid || row.apiTeamId;
        const apiTeamId = apiTeamIdRaw ? Number(apiTeamIdRaw) : null;

        if (!name || !type || Number.isNaN(rank) || Number.isNaN(apiTeamId as number)) {
          return null;
        }

        const payload: any = {
          name,
          type,
          rank,
          logo,
        };

        if (apiTeamId !== null) {
          payload.api_team_id = apiTeamId;
        }

        return {
          sourceIndex: index + 2,
          payload,
        };
      })
      .filter(Boolean) as Array<{ sourceIndex: number; payload: any }>;
  }, [rows]);

  const mutation = useMutation({
    mutationFn: async () => {
      let successCount = 0;
      let failCount = 0;

      for (const row of validRows) {
        const { error } = await supabase.from('teams').upsert(row.payload, { onConflict: 'name' });
        if (error) {
          failCount += 1;
        } else {
          successCount += 1;
        }
      }

      return { successCount, failCount };
    },
    onSuccess: ({ successCount, failCount }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      notify.success(`Імпорт завершено. Успішно: ${successCount}, з помилкою: ${failCount}`);
      onClose();
      setRows([]);
      setFileName('');
    },
    onError: (err: any) => {
      notify.error(err.message || 'Не вдалося імпортувати команди');
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsedRows = parseCsvText(text);
      setRows(parsedRows);
      setFileName(file.name);
      if (!parsedRows.length) {
        notify.warning('Файл не містить рядків для імпорту');
      }
    } catch (error: any) {
      notify.error(error.message || 'Не вдалося прочитати файл');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      handleClose={onClose}
      title="Імпорт команд з CSV"
      actionText="Імпортувати"
      actionFunction={() => mutation.mutate()}>
      <Box display="grid" gap={1.5}>
        <Typography variant="body2">
          Формат колонок: name, type (club або national), rank, logo (опціонально), api_team_id (опціонально)
        </Typography>
        <FormControl fullWidth margin="dense">
          <TextField
            fullWidth
            id="teamsCsv"
            name="teamsCsv"
            label="CSV файл"
            type="file"
            InputLabelProps={{ shrink: true }}
            inputProps={{ accept: '.csv,text/csv,text/plain' }}
            onChange={handleFileChange}
          />
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          Файл: {fileName || 'не обрано'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Рядків у файлі: {rows.length}. Валідних для імпорту: {validRows.length}
        </Typography>
      </Box>
    </Modal>
  );
};

export default ImportTeamsModal;
