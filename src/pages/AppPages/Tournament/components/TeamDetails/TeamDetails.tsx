import { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { Link, useParams } from 'react-router-dom';
import { notify, readLocalCache, resolveAssetUrl, supabase, writeLocalCache } from 'helpers';
import { useAppSelector } from 'store';
import styles from './TeamDetails.module.scss';

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

const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];

const POSITION_META: Record<string, { label: string; short: string; tone: string }> = {
  Goalkeeper: { label: 'Воротарі', short: 'ВР', tone: 'toneGk' },
  Defender: { label: 'Захисники', short: 'ЗХ', tone: 'toneDf' },
  Midfielder: { label: 'Півзахисники', short: 'ПЗ', tone: 'toneMf' },
  Attacker: { label: 'Нападники', short: 'НП', tone: 'toneFw' },
};

const FALLBACK_LOGO = '/logo192.png';
const TEAM_LOCAL_CACHE_TTL_SECONDS = 10 * 60;

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

const groupPlayersByPosition = (players: Player[]) => {
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
    label: POSITION_META[position].label,
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

const EmptyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.2 9.6a2.8 2.8 0 015.4.9c0 1.9-2.6 2.2-2.6 3.9M12 17.4v.2" />
  </svg>
);

const formatNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString('uk-UA') : '—';
};

const TeamDetails: React.FC = () => {
  const { tournamentId, teamId } = useParams<{ tournamentId: string; teamId: string }>();
  const matchesByTournament = useAppSelector((state) => state.match.matches);
  const [data, setData] = useState<TeamDetailsResponse | null>(null);
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
    const fetchData = async () => {
      if (!teamId || !tournamentId) {
        return;
      }

      if (!apiTeamId) {
        setData({
          hasExternalData: false,
          message: 'Для цієї команди ще не заповнено api_team_id в базі даних.',
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
          throw new Error(error.message || 'Не вдалося отримати деталі команди');
        }

        const resolvedData = json as TeamDetailsResponse;
        setData(resolvedData);
        writeLocalCache(cacheKey, resolvedData, TEAM_LOCAL_CACHE_TTL_SECONDS);
      } catch (error: any) {
        notify.error(error.message || 'Не вдалося отримати деталі команди');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [apiTeamId, teamId, tournamentId]);

  const details = data?.external?.details?.response?.[0];
  const squad = data?.external?.squad?.response?.[0];
  const statistics = data?.external?.statistics?.response;
  const players = useMemo(() => normalizePlayers(squad?.players), [squad]);
  const playersByPosition = useMemo(() => groupPlayersByPosition(players), [players]);

  const teamName = details?.team?.name || localTeam?.name || 'Команда';
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
        { label: 'Зіграно', value: formatNumber(played) },
        { label: 'Перемоги', value: formatNumber(wins), tone: 'metricWin' },
        { label: 'Нічиї', value: formatNumber(draws) },
        { label: 'Поразки', value: formatNumber(loses), tone: 'metricLose' },
      ];
    }

    return [
      { label: 'Засновано', value: details?.team?.founded ? String(details.team.founded) : '—' },
      { label: 'Гравців', value: players.length ? String(players.length) : '—' },
      { label: 'Місткість', value: venue?.capacity ? formatNumber(venue.capacity) : '—' },
    ];
  }, [details, draws, hasFixtures, loses, played, players.length, venue, wins]);

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
      { label: 'Країна', value: details.team?.country || '—' },
      { label: 'Засновано', value: details.team?.founded ? String(details.team.founded) : '—' },
      { label: 'Стадіон', value: venue?.name || '—' },
      { label: 'Місто', value: venue?.city || '—' },
      { label: 'Місткість', value: venue?.capacity ? formatNumber(venue.capacity) : '—' },
    ];
  }, [details, venue]);

  const leagueLabel = [statistics?.league?.name, statistics?.league?.season].filter(Boolean).join(' · ');

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
          До матчів
        </Link>

        {!!leagueLabel && <span className={styles.chip}>{leagueLabel}</span>}
      </div>

      <header className={styles.hero}>
        <span className={styles.heroGlow} aria-hidden />

        <div className={styles.heroContent}>
          <div className={styles.heroIdentity}>
            <div className={styles.heroLogo}>
              <img
                src={teamLogo}
                alt={teamName}
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_LOGO;
                }}
              />
            </div>

            <div className={styles.heroText}>
              <span className={styles.heroEyebrow}>
                <ShieldIcon />
                Команда
              </span>

              <h2 className={styles.heroTitle}>{teamName}</h2>

              <div className={styles.heroTags}>
                {!!details?.team?.country && <span className={styles.heroTag}>{details.team.country}</span>}
                {!!details?.team?.founded && <span className={styles.heroTag}>Засновано {details.team.founded}</span>}
                {!!venue?.name && <span className={styles.heroTag}>{venue.name}</span>}
                {!!players.length && <span className={styles.heroTag}>{players.length} гравців</span>}
              </div>

              {!!formItems.length && (
                <div className={styles.heroForm}>
                  <span className={styles.heroFormLabel}>Форма</span>
                  <div className={styles.form}>
                    {formItems.map((result, index) => (
                      <span
                        key={`${result}-${index}`}
                        className={cn(styles.formItem, {
                          [styles.won]: result === 'W',
                          [styles.drawn]: result === 'D',
                          [styles.lost]: result === 'L',
                        })}
                        title={result === 'W' ? 'Перемога' : result === 'D' ? 'Нічия' : 'Поразка'}
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

      {!data?.hasExternalData && (
        <div className={styles.emptyCard}>
          <span className={styles.emptyIcon}>
            <EmptyIcon />
          </span>
          <h3 className={styles.emptyTitle}>Деталі поки недоступні</h3>
          <p className={styles.empty}>{data?.message || 'Для цієї команди ще не привʼязано apiTeamId.'}</p>
        </div>
      )}

      {!!details && (
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}>
              <InfoIcon />
            </span>
            <div className={styles.sectionHeadText}>
              <h3 className={styles.sectionTitle}>Інформація</h3>
              <p className={styles.sectionMeta}>Клуб та домашня арена</p>
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
              <h3 className={styles.sectionTitle}>Статистика</h3>
              <p className={styles.sectionMeta}>{leagueLabel || 'Поточний сезон'}</p>
            </div>
            {hasFixtures && <span className={styles.sectionCount}>{formatNumber(played)} матчів</span>}
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Зіграно</span>
              <span className={styles.statValue}>{formatNumber(played)}</span>
            </div>
            <div className={cn(styles.statItem, styles.statWin)}>
              <span className={styles.statLabel}>Перемоги</span>
              <span className={styles.statValue}>{formatNumber(wins)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Нічиї</span>
              <span className={styles.statValue}>{formatNumber(draws)}</span>
            </div>
            <div className={cn(styles.statItem, styles.statLose)}>
              <span className={styles.statLabel}>Поразки</span>
              <span className={styles.statValue}>{formatNumber(loses)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Забито</span>
              <span className={styles.statValue}>{formatNumber(goalsFor)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Пропущено</span>
              <span className={styles.statValue}>{formatNumber(goalsAgainst)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>«Сухі» матчі</span>
              <span className={styles.statValue}>{formatNumber(statistics?.clean_sheet?.total)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Без голів</span>
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
                  Перемоги {distribution.wins}%
                </span>
                <span className={styles.legendItem}>
                  <span className={cn(styles.legendDot, styles.distributionDraw)} />
                  Нічиї {distribution.draws}%
                </span>
                <span className={styles.legendItem}>
                  <span className={cn(styles.legendDot, styles.distributionLose)} />
                  Поразки {distribution.loses}%
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      {players.length > 0 && (
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}>
              <UsersIcon />
            </span>
            <div className={styles.sectionHeadText}>
              <h3 className={styles.sectionTitle}>Склад</h3>
              <p className={styles.sectionMeta}>Гравці за амплуа</p>
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
                          onError={(event) => {
                            event.currentTarget.src = FALLBACK_LOGO;
                          }}
                        />
                        {!!player.number && <span className={styles.playerNumber}>{player.number}</span>}
                      </span>

                      <div className={styles.playerContent}>
                        <p className={styles.playerName} title={player.name}>
                          {player.name}
                        </p>
                        <p className={styles.playerMeta}>{player.age ? `${player.age} років` : 'Вік невідомий'}</p>
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
