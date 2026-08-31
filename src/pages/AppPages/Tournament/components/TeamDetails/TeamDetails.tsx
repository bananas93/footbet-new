import { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { Link, useParams } from 'react-router-dom';
import { normalizeMatchTime, notify, readLocalCache, resolveAssetUrl, supabase, writeLocalCache } from 'helpers';
import { useAppSelector } from 'store';
import { MatchStatus } from 'interfaces';
import styles from './TeamDetails.module.scss';
import { useI18n } from 'i18n';

type Player = {
  id: number;
  name: string;
  age?: number;
  number?: number;
  position?: string;
  photo?: string;
};

type TeamDetailsResponse = {
  hasExternalData: boolean;
  message?: string;
  localTeam?: any;
  external?: {
    details?: any;
    squad?: any;
    statistics?: any;
  };
};

type UpcomingMatch = {
  id: number;
  tournamentId: number;
  tournamentName: string;
  tournamentLogo?: string;
  matchDate: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
};

type MatchStatusFilter = 'all' | MatchStatus;

type MatchGroup = {
  key: string;
  label: string;
  items: UpcomingMatch[];
};

const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];

const POSITION_META: Record<string, { key: string; short: string; tone: string }> = {
  Goalkeeper: { key: 'gk', short: 'GK', tone: 'toneGk' },
  Defender: { key: 'df', short: 'DF', tone: 'toneDf' },
  Midfielder: { key: 'mf', short: 'MF', tone: 'toneMf' },
  Attacker: { key: 'fw', short: 'FW', tone: 'toneFw' },
};

const FALLBACK_LOGO = '/web-app-manifest-192x192.png';
const TEAM_LOCAL_CACHE_TTL_SECONDS = 10 * 60;
const EMPTY_SCORE = '-';

const handleLogoError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  if (event.currentTarget.src.endsWith(FALLBACK_LOGO)) {
    return;
  }

  event.currentTarget.src = FALLBACK_LOGO;
};

const normalizePlayers = (players: unknown): Player[] => {
  if (!Array.isArray(players)) {
    return [];
  }

  return players
    .filter((item) => !!item && typeof item === 'object')
    .map((item: any) => ({
      id: Number(item.id),
      name: String(item.name || 'Unknown player'),
      age: Number.isFinite(Number(item.age)) ? Number(item.age) : undefined,
      number: Number.isFinite(Number(item.number)) ? Number(item.number) : undefined,
      position: typeof item.position === 'string' && item.position.trim() ? item.position.trim() : 'Other',
      photo: typeof item.photo === 'string' ? item.photo : undefined,
    }));
};

const groupPlayersByPosition = (
  players: Player[],
  t: (key: string, fallback?: string, params?: Record<string, string | number>) => string,
) => {
  const groups: Record<string, Player[]> = {};

  players.forEach((player) => {
    const key = player.position || 'Other';
    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(player);
  });

  const sortPlayers = (list: Player[]) =>
    [...list].sort((a, b) => (a.number ?? 999) - (b.number ?? 999) || a.name.localeCompare(b.name));

  const ordered = POSITION_ORDER.filter((position) => !!groups[position]).map((position) => ({
    position,
    label: t(`pages.teamDetails.position.${POSITION_META[position].key}`),
    short: POSITION_META[position].short,
    tone: POSITION_META[position].tone,
    players: sortPlayers(groups[position]),
  }));

  const rest = Object.keys(groups)
    .filter((position) => !POSITION_ORDER.includes(position))
    .sort((a, b) => a.localeCompare(b))
    .map((position) => ({
      position,
      label: position,
      short: position.slice(0, 2).toUpperCase(),
      tone: 'toneOther',
      players: sortPlayers(groups[position]),
    }));

  return [...ordered, ...rest];
};

const formatRowDate = (date: string) =>
  new Date(date).toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' });

const formatMonthLabel = (date: string) => {
  const label = new Date(date).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const groupMatchesByMonth = (items: UpcomingMatch[]): MatchGroup[] => {
  const groups = new Map<string, MatchGroup>();

  items.forEach((match) => {
    const date = new Date(match.matchDate);
    const key = `${date.getFullYear()}-${date.getMonth()}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: formatMonthLabel(match.matchDate),
        items: [],
      });
    }

    groups.get(key)?.items.push(match);
  });

  return Array.from(groups.values());
};

const ShieldIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.heroEyebrowIcon}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M12 3l7 3v5.5c0 4.2-2.9 7.7-7 9-4.1-1.3-7-4.8-7-9V6l7-3z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.buttonIcon}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

const InfoIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.sectionIconSvg}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.6v.6" />
  </svg>
);

const ChartIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.sectionIconSvg}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M4 19h16" />
    <path d="M7 19v-6M12 19V6M17 19v-9" />
  </svg>
);

const UsersIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.sectionIconSvg}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8" />
    <path d="M16 6.2a3 3 0 010 5.6M17.5 19c0-2.2-.9-3.7-2.3-4.6" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.sectionIconSvg}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <rect x="3.5" y="5.2" width="17" height="15" rx="2.5" />
    <path d="M8 3.2v4M16 3.2v4M3.5 10h17" />
  </svg>
);

const formatNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString('uk-UA') : '—';
};

const TeamDetails: React.FC = () => {
  const { t } = useI18n();
  const { tournamentId, teamId } = useParams<{ tournamentId: string; teamId: string }>();
  const matchesByTournament = useAppSelector((state) => state.match.matches);
  const [data, setData] = useState<TeamDetailsResponse | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [statusFilter, setStatusFilter] = useState<MatchStatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  const localTeam = useMemo(() => {
    if (!teamId || !tournamentId) {
      return null;
    }

    const grouped = matchesByTournament[Number(tournamentId)] || [];
    const allMatches = grouped.flatMap((group) => group.data || []);

    return (
      allMatches.flatMap((match) => [match.homeTeam, match.awayTeam]).find((team) => team?.id === Number(teamId)) ||
      null
    );
  }, [matchesByTournament, teamId, tournamentId]);

  const apiTeamId = localTeam?.apiTeamId;

  useEffect(() => {
    const fetchUpcomingMatches = async () => {
      if (!teamId) {
        setUpcomingMatches([]);
        return;
      }

      try {
        const teamNumericId = Number(teamId);

        const { data: matchesRaw, error } = await supabase
          .from('matches')
          .select(
            `
            id,
            status,
            home_score,
            away_score,
            match_date,
            tournament_id,
            home_team_id,
            away_team_id,
            homeTeam:teams!matches_home_team_id_fkey(id, name, logo),
            awayTeam:teams!matches_away_team_id_fkey(id, name, logo),
            tournament:tournaments!matches_tournament_id_fkey(id, name, logo)
          `,
          )
          .or(`home_team_id.eq.${teamNumericId},away_team_id.eq.${teamNumericId}`)
          .order('match_date', { ascending: true });

        if (error) {
          throw new Error(error.message);
        }

        const nextMatches = (matchesRaw || []).map((item: any) => ({
          id: item.id,
          tournamentId: item.tournament_id,
          tournamentName: item.tournament?.name || t('pages.teamDetails.fallbackTournament'),
          tournamentLogo: item.tournament?.logo || '',
          matchDate: item.match_date,
          status: item.status,
          homeScore: item.home_score,
          awayScore: item.away_score,
          homeTeamId: item.home_team_id,
          awayTeamId: item.away_team_id,
          homeTeamName: item.homeTeam?.name || t('pages.matchDetails.homeTeamFallback'),
          awayTeamName: item.awayTeam?.name || t('pages.matchDetails.awayTeamFallback'),
          homeTeamLogo: item.homeTeam?.logo || '',
          awayTeamLogo: item.awayTeam?.logo || '',
        })) as UpcomingMatch[];

        setUpcomingMatches(nextMatches);
      } catch (error: any) {
        notify.error(error.message || t('pages.teamDetails.fetchError'));
      }
    };

    void fetchUpcomingMatches();
  }, [t, teamId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!teamId || !tournamentId) {
        return;
      }

      if (!apiTeamId) {
        setData({
          hasExternalData: false,
          message: t('pages.teamDetails.apiTeamMissing'),
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const cacheKey = `football-details:team:${apiTeamId}`;
        const cached = readLocalCache<TeamDetailsResponse>(cacheKey);

        if (cached) {
          setData(cached);
          return;
        }

        const { data: json, error } = await supabase.functions.invoke('football-details', {
          body: {
            type: 'team',
            apiTeamId,
          },
        });

        if (error) {
          throw new Error(error.message || t('pages.teamDetails.fetchError'));
        }

        const resolvedData = json as TeamDetailsResponse;
        setData(resolvedData);
        writeLocalCache(cacheKey, resolvedData, TEAM_LOCAL_CACHE_TTL_SECONDS);
      } catch (error: any) {
        notify.error(error.message || t('pages.teamDetails.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [apiTeamId, t, teamId, tournamentId]);

  const details = data?.external?.details?.response?.[0];
  const squad = data?.external?.squad?.response?.[0];
  const statistics = data?.external?.statistics?.response;
  const players = useMemo(() => normalizePlayers(squad?.players), [squad]);
  const playersByPosition = useMemo(() => groupPlayersByPosition(players, t), [players, t]);

  const teamName = details?.team?.name || localTeam?.name || t('pages.teamDetails.fallbackTeam');
  const teamLogo = details?.team?.logo || resolveAssetUrl(localTeam?.logo) || FALLBACK_LOGO;
  const venue = details?.venue;

  const played = Number(statistics?.fixtures?.played?.total);
  const wins = Number(statistics?.fixtures?.wins?.total);
  const draws = Number(statistics?.fixtures?.draws?.total);
  const loses = Number(statistics?.fixtures?.loses?.total);
  const goalsFor = statistics?.goals?.for?.total?.total;
  const goalsAgainst = statistics?.goals?.against?.total?.total;
  const hasFixtures = Number.isFinite(played) && played > 0;

  const heroMetrics = useMemo<{ label: string; value: string; tone?: string }[]>(() => {
    if (hasFixtures) {
      return [
        { label: t('pages.teamDetails.played'), value: formatNumber(played) },
        { label: t('pages.teamDetails.wins'), value: formatNumber(wins), tone: 'metricWin' },
        { label: t('pages.teamDetails.draws'), value: formatNumber(draws) },
        { label: t('pages.teamDetails.losses'), value: formatNumber(loses), tone: 'metricLose' },
      ];
    }

    return [
      { label: t('pages.teamDetails.founded'), value: details?.team?.founded ? String(details.team.founded) : '—' },
      { label: t('pages.teamDetails.players'), value: players.length ? String(players.length) : '—' },
      { label: t('pages.teamDetails.capacity'), value: venue?.capacity ? formatNumber(venue.capacity) : '—' },
    ];
  }, [details, draws, hasFixtures, loses, played, players.length, t, venue, wins]);

  const formItems = useMemo(
    () =>
      String(statistics?.form || '')
        .toUpperCase()
        .replace(/[^WDL]/g, '')
        .split('')
        .slice(-6),
    [statistics],
  );

  const distribution = useMemo(() => {
    if (!hasFixtures) {
      return null;
    }

    const toPercent = (value: number) => (Number.isFinite(value) ? Math.round((value / played) * 100) : 0);

    return {
      wins: toPercent(wins),
      draws: toPercent(draws),
      loses: toPercent(loses),
    };
  }, [draws, hasFixtures, loses, played, wins]);

  const infoItems = useMemo(() => {
    if (!details) {
      return [];
    }

    return [
      { label: t('pages.teamDetails.country'), value: details.team?.country || '—' },
      { label: t('pages.teamDetails.founded'), value: details.team?.founded ? String(details.team.founded) : '—' },
      { label: t('pages.teamDetails.stadium'), value: venue?.name || '—' },
      { label: t('pages.teamDetails.city'), value: venue?.city || '—' },
      { label: t('pages.teamDetails.capacity'), value: venue?.capacity ? formatNumber(venue.capacity) : '—' },
    ];
  }, [details, t, venue]);

  const leagueLabel = [statistics?.league?.name, statistics?.league?.season].filter(Boolean).join(' · ');

  const filteredMatches = useMemo(() => {
    if (statusFilter === 'all') {
      return upcomingMatches;
    }

    return upcomingMatches.filter((match) => match.status === statusFilter);
  }, [statusFilter, upcomingMatches]);

  const matchGroups = useMemo(() => groupMatchesByMonth(filteredMatches), [filteredMatches]);

  const statusCounts = useMemo(() => {
    const counts = upcomingMatches.reduce<Record<string, number>>((acc, match) => {
      acc[match.status] = (acc[match.status] || 0) + 1;
      return acc;
    }, {});

    return { ...counts, all: upcomingMatches.length } as Record<MatchStatusFilter, number>;
  }, [upcomingMatches]);

  const statusFilters = useMemo(
    () =>
      (
        [
          { key: 'all' as MatchStatusFilter, label: t('pages.teamDetails.filterAllStatuses') },
          { key: MatchStatus.SCHEDULED, label: t('pages.status.scheduled') },
          { key: MatchStatus.IN_PROGRESS, label: t('pages.status.live') },
          { key: MatchStatus.FINISHED, label: t('pages.status.completed') },
          { key: MatchStatus.POSTPONED, label: t('pages.status.postponed') },
        ] as Array<{ key: MatchStatusFilter; label: string }>
      )
        .map((filter) => ({ ...filter, count: statusCounts[filter.key] || 0 }))
        .filter((filter) => filter.key === 'all' || filter.count > 0),
    [statusCounts, t],
  );

  const renderRowTeam = (name: string, logo: string | undefined, isCurrent: boolean, isHomeSide: boolean) => {
    const logoNode = (
      <span className={styles.rowTeamLogo}>
        <img src={resolveAssetUrl(logo) || FALLBACK_LOGO} alt="" loading="lazy" onError={handleLogoError} />
      </span>
    );

    const nameNode = (
      <span className={styles.rowTeamName} title={name}>
        {name}
      </span>
    );

    return (
      <div
        className={cn(styles.rowTeam, isHomeSide ? styles.rowTeamHome : styles.rowTeamAway, {
          [styles.rowTeamCurrent]: isCurrent,
        })}>
        {isHomeSide ? (
          <>
            {nameNode}
            {logoNode}
          </>
        ) : (
          <>
            {logoNode}
            {nameNode}
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <span className={cn(styles.skeletonBlock, styles.skeletonHero)} />
        <span className={cn(styles.skeletonBlock, styles.skeletonRow)} />
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 6 }, (_, index) => (
            <span className={styles.skeletonBlock} key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link to={`/tournament/${tournamentId}`} className={styles.backLink}>
          <ArrowLeftIcon />
          {t('pages.teamDetails.toMatches')}
        </Link>

        {!!leagueLabel && <span className={styles.chip}>{leagueLabel}</span>}
      </div>

      <header className={styles.hero}>
        <span className={styles.heroGlow} aria-hidden />

        <div className={styles.heroContent}>
          <div className={styles.heroIdentity}>
            <div className={styles.heroLogo}>
              <img src={teamLogo} alt={teamName} onError={handleLogoError} />
            </div>

            <div className={styles.heroText}>
              <span className={styles.heroEyebrow}>
                <ShieldIcon />
                {t('pages.teamDetails.hero')}
              </span>

              <h2 className={styles.heroTitle}>{teamName}</h2>

              <div className={styles.heroTags}>
                {!!details?.team?.country && <span className={styles.heroTag}>{details.team.country}</span>}
                {!!details?.team?.founded && (
                  <span className={styles.heroTag}>
                    {t('pages.teamDetails.founded')} {details.team.founded}
                  </span>
                )}
                {!!venue?.name && <span className={styles.heroTag}>{venue.name}</span>}
                {!!players.length && (
                  <span className={styles.heroTag}>
                    {t('pages.teamDetails.playersCount', undefined, { count: players.length })}
                  </span>
                )}
              </div>

              {!!formItems.length && (
                <div className={styles.heroForm}>
                  <span className={styles.heroFormLabel}>{t('pages.teamDetails.form')}</span>
                  <div className={styles.form}>
                    {formItems.map((result, index) => (
                      <span
                        key={`${result}-${index}`}
                        className={cn(styles.formItem, {
                          [styles.won]: result === 'W',
                          [styles.drawn]: result === 'D',
                          [styles.lost]: result === 'L',
                        })}
                        title={
                          result === 'W'
                            ? t('pages.teamDetails.formWin')
                            : result === 'D'
                              ? t('pages.teamDetails.formDraw')
                              : t('pages.teamDetails.formLose')
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.heroMetrics}>
            {heroMetrics.map((metric) => (
              <div key={metric.label} className={cn(styles.heroMetric, metric.tone && styles[metric.tone])}>
                <span className={styles.heroMetricValue}>{metric.value}</span>
                <span className={styles.heroMetricLabel}>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {!!details && (
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}>
              <InfoIcon />
            </span>
            <div className={styles.sectionHeadText}>
              <h3 className={styles.sectionTitle}>{t('pages.teamDetails.infoTitle')}</h3>
              <p className={styles.sectionMeta}>{t('pages.teamDetails.infoMeta')}</p>
            </div>
          </div>

          <div className={styles.infoGrid}>
            {infoItems.map((item) => (
              <div key={item.label} className={styles.infoItem}>
                <span className={styles.infoLabel}>{item.label}</span>
                <span className={styles.infoValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {!!statistics && (
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}>
              <ChartIcon />
            </span>
            <div className={styles.sectionHeadText}>
              <h3 className={styles.sectionTitle}>{t('pages.teamDetails.statsTitle')}</h3>
              <p className={styles.sectionMeta}>{leagueLabel || t('pages.teamDetails.currentSeason')}</p>
            </div>
            {hasFixtures && (
              <span className={styles.sectionCount}>
                {t('pages.teamDetails.matchesCount', undefined, { count: formatNumber(played) })}
              </span>
            )}
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('pages.teamDetails.played')}</span>
              <span className={styles.statValue}>{formatNumber(played)}</span>
            </div>
            <div className={cn(styles.statItem, styles.statWin)}>
              <span className={styles.statLabel}>{t('pages.teamDetails.wins')}</span>
              <span className={styles.statValue}>{formatNumber(wins)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('pages.teamDetails.draws')}</span>
              <span className={styles.statValue}>{formatNumber(draws)}</span>
            </div>
            <div className={cn(styles.statItem, styles.statLose)}>
              <span className={styles.statLabel}>{t('pages.teamDetails.losses')}</span>
              <span className={styles.statValue}>{formatNumber(loses)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('pages.teamDetails.goalsFor')}</span>
              <span className={styles.statValue}>{formatNumber(goalsFor)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('pages.teamDetails.goalsAgainst')}</span>
              <span className={styles.statValue}>{formatNumber(goalsAgainst)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('pages.teamDetails.cleanSheets')}</span>
              <span className={styles.statValue}>{formatNumber(statistics?.clean_sheet?.total)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('pages.teamDetails.failedToScore')}</span>
              <span className={styles.statValue}>{formatNumber(statistics?.failed_to_score?.total)}</span>
            </div>
          </div>

          {!!distribution && (
            <div className={styles.distribution}>
              <div className={styles.distributionBar}>
                <span
                  className={cn(styles.distributionPart, styles.distributionWin)}
                  style={{ width: `${distribution.wins}%` }}
                />
                <span
                  className={cn(styles.distributionPart, styles.distributionDraw)}
                  style={{ width: `${distribution.draws}%` }}
                />
                <span
                  className={cn(styles.distributionPart, styles.distributionLose)}
                  style={{ width: `${distribution.loses}%` }}
                />
              </div>

              <div className={styles.distributionLegend}>
                <span className={styles.legendItem}>
                  <span className={cn(styles.legendDot, styles.distributionWin)} />
                  {t('pages.teamDetails.distributionWins', undefined, { value: distribution.wins })}
                </span>
                <span className={styles.legendItem}>
                  <span className={cn(styles.legendDot, styles.distributionDraw)} />
                  {t('pages.teamDetails.distributionDraws', undefined, { value: distribution.draws })}
                </span>
                <span className={styles.legendItem}>
                  <span className={cn(styles.legendDot, styles.distributionLose)} />
                  {t('pages.teamDetails.distributionLosses', undefined, { value: distribution.loses })}
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      <section className={styles.card}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>
            <CalendarIcon />
          </span>
          <div className={styles.sectionHeadText}>
            <h3 className={styles.sectionTitle}>{t('pages.teamDetails.nextMatchesTitle')}</h3>
            <p className={styles.sectionMeta}>{t('pages.teamDetails.nextMatchesMeta')}</p>
          </div>
          <span className={styles.sectionCount}>{filteredMatches.length}</span>
        </div>

        <div className={styles.filterBar}>
          {statusFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={cn(styles.filterTab, { [styles.filterTabActive]: statusFilter === filter.key })}
              onClick={() => setStatusFilter(filter.key)}>
              {filter.key === MatchStatus.IN_PROGRESS && <span className={styles.liveDot} />}
              <span className={styles.filterLabel}>{filter.label}</span>
              <span className={styles.filterCount}>{filter.count}</span>
            </button>
          ))}
        </div>

        {!!matchGroups.length && (
          <div className={styles.matchGroups}>
            {matchGroups.map((group) => (
              <div className={styles.matchGroup} key={group.key}>
                <div className={styles.matchGroupHead}>
                  <span className={styles.matchGroupLabel}>{group.label}</span>
                  <span className={styles.matchGroupCount}>{group.items.length}</span>
                </div>

                <div className={styles.matchRows}>
                  {group.items.map((match) => {
                    const isHome = match.homeTeamId === Number(teamId);
                    const isLive = match.status === MatchStatus.IN_PROGRESS;
                    const isScheduled = match.status === MatchStatus.SCHEDULED;
                    const isPostponed = match.status === MatchStatus.POSTPONED;
                    const isPlayed = isLive || match.status === MatchStatus.FINISHED;
                    const hasScore =
                      isPlayed &&
                      match.homeScore !== null &&
                      match.awayScore !== null &&
                      Number.isFinite(Number(match.homeScore)) &&
                      Number.isFinite(Number(match.awayScore));
                    const teamGoals = hasScore ? (isHome ? Number(match.homeScore) : Number(match.awayScore)) : null;
                    const opponentGoals = hasScore
                      ? isHome
                        ? Number(match.awayScore)
                        : Number(match.homeScore)
                      : null;
                    const outcome =
                      match.status === MatchStatus.FINISHED && teamGoals !== null && opponentGoals !== null
                        ? teamGoals > opponentGoals
                          ? 'win'
                          : teamGoals < opponentGoals
                            ? 'lose'
                            : 'draw'
                        : null;

                    return (
                      <Link
                        key={match.id}
                        to={`/tournament/${match.tournamentId}/match/${match.id}`}
                        className={cn(styles.matchRow, {
                          [styles.matchRowLive]: isLive,
                          [styles.matchRowScheduled]: isScheduled,
                          [styles.matchRowPostponed]: isPostponed,
                          [styles.matchRowFinished]: match.status === MatchStatus.FINISHED,
                          [styles.matchRowWin]: outcome === 'win',
                          [styles.matchRowDraw]: outcome === 'draw',
                          [styles.matchRowLose]: outcome === 'lose',
                        })}
                        aria-label={t('pages.matchCard.openMatchDetails', undefined, {
                          home: match.homeTeamName,
                          away: match.awayTeamName,
                        })}>
                        <div className={styles.rowDate}>
                          <span className={styles.rowDateDay}>{formatRowDate(match.matchDate)}</span>

                          {isLive ? (
                            <span className={styles.rowLive}>
                              <span className={styles.liveDot} />
                              {t('pages.status.live')}
                            </span>
                          ) : isPostponed ? (
                            <span className={styles.rowPostponed}>{t('pages.status.postponed')}</span>
                          ) : (
                            <span className={styles.rowDateTime}>{normalizeMatchTime(match.matchDate)}</span>
                          )}
                        </div>

                        <span className={styles.rowTournament} title={match.tournamentName}>
                          <img
                            src={resolveAssetUrl(match.tournamentLogo) || FALLBACK_LOGO}
                            alt={match.tournamentName}
                            loading="lazy"
                            onError={handleLogoError}
                          />
                        </span>

                        <div className={styles.rowMatchup}>
                          {renderRowTeam(match.homeTeamName, match.homeTeamLogo, isHome, true)}

                          <span
                            className={cn(styles.rowScore, {
                              [styles.rowScoreLive]: isLive,
                              [styles.rowScorePending]: !hasScore,
                              [styles.rowScoreWin]: outcome === 'win',
                              [styles.rowScoreDraw]: outcome === 'draw',
                              [styles.rowScoreLose]: outcome === 'lose',
                            })}>
                            <span className={styles.rowScoreValue}>{hasScore ? match.homeScore : EMPTY_SCORE}</span>
                            <span className={styles.rowScoreDash}>:</span>
                            <span className={styles.rowScoreValue}>{hasScore ? match.awayScore : EMPTY_SCORE}</span>
                          </span>

                          {renderRowTeam(match.awayTeamName, match.awayTeamLogo, !isHome, false)}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {!matchGroups.length && (
          <div className={styles.emptyBlock}>
            <span className={styles.emptyIcon}>
              <CalendarIcon />
            </span>
            <p className={styles.emptyTitle}>{t('pages.teamDetails.nextMatchesEmptyTitle')}</p>
            <p className={styles.empty}>{t('pages.teamDetails.nextMatchesEmpty')}</p>
          </div>
        )}
      </section>

      {players.length > 0 && (
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}>
              <UsersIcon />
            </span>
            <div className={styles.sectionHeadText}>
              <h3 className={styles.sectionTitle}>{t('pages.teamDetails.squadTitle')}</h3>
              <p className={styles.sectionMeta}>{t('pages.teamDetails.squadMeta')}</p>
            </div>
            <span className={styles.sectionCount}>{players.length}</span>
          </div>

          <div className={styles.positions}>
            {playersByPosition.map((group) => (
              <div key={group.position} className={cn(styles.positionBlock, styles[group.tone])}>
                <div className={styles.positionHead}>
                  <span className={styles.positionBadge}>{group.short}</span>
                  <h4 className={styles.positionTitle}>{group.label}</h4>
                  <span className={styles.positionCount}>{group.players.length}</span>
                </div>

                <div className={styles.playersGrid}>
                  {group.players.map((player) => (
                    <article key={player.id || player.name} className={styles.playerCard}>
                      <span className={styles.playerPhotoWrap}>
                        <img
                          src={player.photo || FALLBACK_LOGO}
                          alt={player.name}
                          className={styles.playerPhoto}
                          loading="lazy"
                          onError={handleLogoError}
                        />
                        {!!player.number && <span className={styles.playerNumber}>{player.number}</span>}
                      </span>

                      <div className={styles.playerContent}>
                        <p className={styles.playerName} title={player.name}>
                          {player.name}
                        </p>
                        <p className={styles.playerMeta}>
                          {player.age
                            ? t('pages.teamDetails.years', undefined, { value: player.age })
                            : t('pages.teamDetails.unknownAge')}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default TeamDetails;
