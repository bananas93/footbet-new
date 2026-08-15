import { FC, useMemo, useState } from 'react';
import { Box, CircularProgress, FormControl, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '../../../components/Modal/Modal';
import { parseCsvText } from '../../../helpers/csv';
import { notify } from '../../../helpers/notify';
import { supabase } from '../../../helpers/supabase';
import { ITournament } from '../../../interfaces/tournament';
import { GROUP_TOUR_OPTIONS, MatchStageEnum } from '../../../interfaces/match';
import { mapTeamFromDb } from '../../../helpers/mappers';
import { ITeam } from '../../../interfaces/team';
import { parseLeagueIndex } from '../../../helpers/league';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tournaments: ITournament[];
}

const STAGES = Object.values(MatchStageEnum);
const GROUP_TOURS = new Set(GROUP_TOUR_OPTIONS);

const pickValue = (row: Record<string, string>, aliases: string[]): string => {
  for (const alias of aliases) {
    const value = row[alias];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return '';
};

const normalizeLookupKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/["'`’]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseMatchDate = (raw: string): Date | null => {
  const value = raw.trim();
  if (!value) return null;

  const fallback = new Date(value);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }

  const localMatch = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!localMatch) {
    return null;
  }

  const [, d, m, y, hh = '0', mm = '0'] = localMatch;
  const normalized = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:00`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseStage = (raw: string): string | null => {
  const value = raw.trim();
  if (!value) return null;
  if (STAGES.includes(value as any)) return value;

  const normalized = value.toLowerCase().replace(/\s+/g, '_');
  const key = Object.keys(MatchStageEnum).find((k) => k.toLowerCase() === normalized);
  return key ? MatchStageEnum[key as keyof typeof MatchStageEnum] : null;
};

const parseGroupTour = (raw: string): string | null => {
  const value = raw.trim();
  if (!value) return null;
  if (GROUP_TOURS.has(value as `${number} tour`)) return value;

  const numeric = Number(value);
  if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= GROUP_TOUR_OPTIONS.length) {
    return `${numeric} tour`;
  }

  return null;
};

const ImportMatchesModal: FC<Props> = ({ isOpen, onClose, tournaments }) => {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const queryClient = useQueryClient();

  const teamsQuery = useQuery<ITeam[]>({
    queryKey: ['teams', 'import-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, type, rank, logo, created_at, updated_at')
        .order('name', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(mapTeamFromDb) as ITeam[];
    },
    enabled: isOpen,
  });

  const validation = useMemo(() => {
    if (!teamsQuery.data) {
      return {
        validRows: [] as Array<{ sourceIndex: number; payload: any }>,
        invalidRows: [] as Array<{ sourceIndex: number; reason: string }>,
      };
    }

    const tournamentByName = new Map(tournaments.map((item) => [normalizeLookupKey(item.name), item.id]));
    const teamByName = new Map(teamsQuery.data.map((item: ITeam) => [normalizeLookupKey(item.name), item.id]));

    const validRows: Array<{ sourceIndex: number; payload: any }> = [];
    const invalidRows: Array<{ sourceIndex: number; reason: string }> = [];

    rows.forEach((row, index) => {
      const sourceIndex = index + 2;
      const tournamentIdRaw = pickValue(row, ['tournament_id', 'tournamentid']);
      const tournamentNameRaw = pickValue(row, ['tournament', 'tournament_name', 'league_name']);
      const homeTeamIdRaw = pickValue(row, ['home_team_id', 'hometeamid', 'team_1_id', 'team1_id']);
      const awayTeamIdRaw = pickValue(row, ['away_team_id', 'awayteamid', 'team_2_id', 'team2_id']);
      const homeTeamNameRaw = pickValue(row, ['home_team', 'home', 'home_team_name', 'team_1', 'team1']);
      const awayTeamNameRaw = pickValue(row, ['away_team', 'away', 'away_team_name', 'team_2', 'team2']);
      const stageRaw = pickValue(row, ['stage', 'match_stage']);
      const matchDateRaw = pickValue(row, ['match_date', 'date', 'kickoff', 'start_at']);
      const groupTourRaw = pickValue(row, ['group_tour', 'tour', 'round']);
      const groupNameRaw = pickValue(row, ['group_name', 'group']);
      const tournamentLeagueRaw = pickValue(row, ['tournament_league', 'league', 'league_index']);
      const apiFixtureIdRaw = pickValue(row, ['api_fixture_id', 'fixture_id', 'fixtureid']);

      const tournamentId = Number(tournamentIdRaw) || tournamentByName.get(normalizeLookupKey(tournamentNameRaw));
      const homeTeamId = Number(homeTeamIdRaw) || teamByName.get(normalizeLookupKey(homeTeamNameRaw));
      const awayTeamId = Number(awayTeamIdRaw) || teamByName.get(normalizeLookupKey(awayTeamNameRaw));
      const stage = parseStage(stageRaw || '');
      const parsedDate = parseMatchDate(matchDateRaw || '');
      const groupTour = parseGroupTour(groupTourRaw || '');
      const groupName = (groupNameRaw || '').trim() || null;
      const tournamentLeague = parseLeagueIndex(tournamentLeagueRaw, 1);
      const apiFixtureId = apiFixtureIdRaw ? Number(apiFixtureIdRaw) : null;

      if (!tournamentId) {
        invalidRows.push({ sourceIndex, reason: 'Не знайдено турнір (tournament_id або tournament)' });
        return;
      }

      if (!homeTeamId || !awayTeamId) {
        invalidRows.push({
          sourceIndex,
          reason: 'Не знайдено команду (home_team/away_team). Перевір назви або додай home_team_id/away_team_id',
        });
        return;
      }

      if (!stage) {
        invalidRows.push({ sourceIndex, reason: 'Некоректний stage' });
        return;
      }

      if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
        invalidRows.push({ sourceIndex, reason: 'Некоректна match_date (рекомендовано ISO або DD.MM.YYYY HH:mm)' });
        return;
      }

      if (homeTeamId === awayTeamId) {
        invalidRows.push({ sourceIndex, reason: 'home_team і away_team не можуть бути однаковими' });
        return;
      }

      if (Number.isNaN(tournamentLeague)) {
        invalidRows.push({ sourceIndex, reason: 'Некоректний tournament_league' });
        return;
      }

      if (Number.isNaN(apiFixtureId as number)) {
        invalidRows.push({ sourceIndex, reason: 'Некоректний api_fixture_id' });
        return;
      }

      validRows.push({
        sourceIndex,
        payload: {
          stage,
          group_tour: groupTour,
          group_name: groupName,
          api_fixture_id: apiFixtureId,
          status: 'Scheduled',
          match_date: parsedDate.toISOString(),
          tournament_id: tournamentId,
          tournament_league: tournamentLeague,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          home_score: 0,
          away_score: 0,
        },
      });
    });

    return { validRows, invalidRows };
  }, [rows, teamsQuery.data, tournaments]);

  const { validRows, invalidRows } = validation;

  const mutation = useMutation({
    mutationFn: async () => {
      let successCount = 0;
      let failCount = 0;

      for (const row of validRows) {
        const { error } = await supabase.from('matches').insert(row.payload);
        if (error) {
          failCount += 1;
        } else {
          successCount += 1;
        }
      }

      return { successCount, failCount };
    },
    onSuccess: ({ successCount, failCount }) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      notify.success(`Імпорт завершено. Успішно: ${successCount}, з помилкою: ${failCount}`);
      onClose();
      setRows([]);
      setFileName('');
    },
    onError: (err: any) => {
      notify.error(err.message || 'Не вдалося імпортувати матчі');
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
      title="Імпорт матчів з CSV"
      actionText="Імпортувати"
      actionFunction={() => mutation.mutate()}>
      <Box display="grid" gap={1.5}>
        <Typography variant="body2">
          Колонки (ID не обовʼязкові): tournament або tournament_id, home_team або away_team (або *_id), match_date,
          stage, group_tour (опц.), group_name (опц.), tournament_league (опц., число або літера A/B/C/D),
          api_fixture_id (опц.)
        </Typography>
        <FormControl fullWidth margin="dense">
          <TextField
            fullWidth
            id="matchesCsv"
            name="matchesCsv"
            label="CSV файл"
            type="file"
            InputLabelProps={{ shrink: true }}
            inputProps={{ accept: '.csv,text/csv,text/plain' }}
            onChange={handleFileChange}
          />
        </FormControl>
        {teamsQuery.isLoading && (
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={16} />
            <Typography variant="body2">Завантаження довідника команд...</Typography>
          </Box>
        )}
        <Typography variant="body2" color="text.secondary">
          Файл: {fileName || 'не обрано'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Рядків у файлі: {rows.length}. Валідних для імпорту: {validRows.length}
        </Typography>
        {!!invalidRows.length && (
          <Typography variant="body2" color="error">
            Невалідних рядків: {invalidRows.length}. Приклади:{' '}
            {invalidRows
              .slice(0, 3)
              .map((item) => `#${item.sourceIndex} ${item.reason}`)
              .join('; ')}
          </Typography>
        )}
      </Box>
    </Modal>
  );
};

export default ImportMatchesModal;
