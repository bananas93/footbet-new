const LEAGUE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const getLeagueLabel = (leagueIndex?: number | null): string => {
  if (!leagueIndex || leagueIndex < 1) {
    return 'A';
  }

  return LEAGUE_LABELS[leagueIndex - 1] || String(leagueIndex);
};

export const parseLeagueIndex = (value: unknown, fallback = 1): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value));
  }

  const raw = String(value || '').trim();
  if (!raw) {
    return fallback;
  }

  const asNumber = Number(raw);
  if (Number.isFinite(asNumber)) {
    return Math.max(1, Math.floor(asNumber));
  }

  const idx = LEAGUE_LABELS.indexOf(raw.toUpperCase());
  return idx >= 0 ? idx + 1 : fallback;
};
