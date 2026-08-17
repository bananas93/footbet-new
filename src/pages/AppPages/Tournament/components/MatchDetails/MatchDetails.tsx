/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { Link, useParams } from 'react-router-dom';
import {
  normalizeMatchDate,
  normalizeMatchTime,
  notify,
  readLocalCache,
  resolveAssetUrl,
  supabase,
  writeLocalCache,
} from 'helpers';
import { useAppSelector } from 'store';
import { MatchStatus } from 'interfaces';
import styles from './MatchDetails.module.scss';
import { useI18n } from 'i18n';

type MatchDetailsResponse = {
  hasExternalData: boolean;
  message?: string;
  localMatch?: any;
  external?: {
    fixture?: any;
    lineups?: any;
    statistics?: any;
    events?: any;
  };
};

type MatchDetailsCacheEntry = {
  payload: MatchDetailsResponse;
  cachedAt: number;
};

type StatRow = {
  type: string;
  label: string;
  home: string;
  away: string;
  homeShare: number;
  awayShare: number;
};

const MATCH_LOCAL_CACHE_TTL_SECONDS = 20;

const FALLBACK_LOGO = '/logo192.png';

const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT', 'LIVE'];
const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];

const STAT_LABELS: Record<string, string> = {
  'Ball Possession': 'pages.matchDetails.stats.ballPossession',
  'Total Shots': 'pages.matchDetails.stats.totalShots',
  'Shots on Goal': 'pages.matchDetails.stats.shotsOnGoal',
  'Shots off Goal': 'pages.matchDetails.stats.shotsOffGoal',
  'Blocked Shots': 'pages.matchDetails.stats.blockedShots',
  'Shots insidebox': 'pages.matchDetails.stats.shotsInsideBox',
  'Shots outsidebox': 'pages.matchDetails.stats.shotsOutsideBox',
  'Corner Kicks': 'pages.matchDetails.stats.cornerKicks',
  Offsides: 'pages.matchDetails.stats.offsides',
  Fouls: 'pages.matchDetails.stats.fouls',
  'Yellow Cards': 'pages.matchDetails.stats.yellowCards',
  'Red Cards': 'pages.matchDetails.stats.redCards',
  'Goalkeeper Saves': 'pages.matchDetails.stats.goalkeeperSaves',
  'Total passes': 'pages.matchDetails.stats.totalPasses',
  'Passes accurate': 'pages.matchDetails.stats.passesAccurate',
  'Passes %': 'pages.matchDetails.stats.passesPercent',
  expected_goals: 'pages.matchDetails.stats.expectedGoals',
  goals_prevented: 'pages.matchDetails.stats.goalsPrevented',
};

const STAT_ORDER = [
  'Ball Possession',
  'expected_goals',
  'Total Shots',
  'Shots on Goal',
  'Shots off Goal',
  'Blocked Shots',
  'Corner Kicks',
  'Offsides',
  'Goalkeeper Saves',
  'Total passes',
  'Passes accurate',
  'Passes %',
  'Fouls',
  'Yellow Cards',
  'Red Cards',
];

const POSITION_LABELS: Record<string, string> = {
  G: 'pages.matchDetails.positions.goalkeeper',
  D: 'pages.matchDetails.positions.defender',
  M: 'pages.matchDetails.positions.midfielder',
  F: 'pages.matchDetails.positions.forward',
};

const GOAL_DETAILS: Record<string, string> = {
  'Normal Goal': 'pages.matchDetails.event.goal',
  'Own Goal': 'pages.matchDetails.event.ownGoal',
  Penalty: 'pages.matchDetails.event.penaltyGoal',
  'Missed Penalty': 'pages.matchDetails.event.missedPenalty',
};

const CARD_DETAILS: Record<string, string> = {
  'Yellow Card': 'pages.matchDetails.event.yellowCard',
  'Second Yellow card': 'pages.matchDetails.event.secondYellowCard',
  'Red Card': 'pages.matchDetails.event.redCard',
};

const toStatNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const numeric = Number(String(value).replace('%', '').replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : 0;
};

const toStatText = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  return String(value);
};

const RefreshIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.buttonIcon}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M20 12a8 8 0 11-2.6-5.9" />
    <path d="M20 4v4.2h-4.2" />
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

const ClockIcon = () => (
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
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);

const BallIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.eventIconSvg}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2l3.4 2.5-1.3 4h-4.2l-1.3-4L12 7.2z" />
    <path d="M12 3.5v3.7M4.4 9.6l3.2 2.1M19.6 9.6l-3.2 2.1M7.8 19.4l1.9-3.5M16.2 19.4l-1.9-3.5" />
  </svg>
);

const CardIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.eventIconSvg} fill="currentColor">
    <rect x="7" y="4" width="10" height="16" rx="2" />
  </svg>
);

const SubstIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.eventIconSvg}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M5 9h11l-3-3M19 15H8l3 3" />
  </svg>
);

const VarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.eventIconSvg}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <rect x="3.5" y="5" width="17" height="12" rx="2" />
    <path d="M9 20h6" />
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

const MatchDetails: React.FC = () => {
  const { t, lang } = useI18n();
  const { tournamentId, matchId } = useParams<{ tournamentId: string; matchId: string }>();
  const matchesByTournament = useAppSelector((state) => state.match.matches);
  const [data, setData] = useState<MatchDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const currentMatch = useMemo(() => {
    if (!tournamentId || !matchId) {
      return null;
    }

    const grouped = matchesByTournament[Number(tournamentId)] || [];
    return grouped.flatMap((group) => group.data || []).find((item) => item.id === Number(matchId)) || null;
  }, [matchId, matchesByTournament, tournamentId]);

  const fixtureId = currentMatch?.apiFixtureId;

  const fetchDetails = async (silent = false, forceRefresh = false) => {
    if (!fixtureId) {
      if (!silent) {
        setIsLoading(false);
      }
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }

    try {
      const cacheKey = `football-details:match:${fixtureId}`;

      if (!forceRefresh) {
        const cached = readLocalCache<MatchDetailsCacheEntry>(cacheKey);
        if (cached) {
          setData(cached.payload);
          setLastUpdated(new Date(cached.cachedAt));
          return;
        }
      }

      const { data: json, error } = await supabase.functions.invoke('football-details', {
        body: {
          type: 'match',
          fixtureId,
          forceRefresh,
        },
      });

      if (error) {
        throw new Error(error.message || t('pages.matchDetails.errors.fetchFailed'));
      }

      const resolvedData = json as MatchDetailsResponse;
      const cachedAt = Date.now();
      setData(resolvedData);
      setLastUpdated(new Date(cachedAt));
      writeLocalCache<MatchDetailsCacheEntry>(
        cacheKey,
        {
          payload: resolvedData,
          cachedAt,
        },
        MATCH_LOCAL_CACHE_TTL_SECONDS,
      );
    } catch (error: any) {
      notify.error(error.message || t('pages.matchDetails.errors.fetchFailed'));
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    await fetchDetails(true, true);
    setIsRefreshing(false);
  };

  useEffect(() => {
    void fetchDetails();
  }, [fixtureId]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchDetails(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fixtureId]);

  const fixtureResponse = useMemo(() => data?.external?.fixture?.response || [], [data]);
  const fixture = fixtureResponse?.[0] || null;

  const homeTeam = {
    id: fixture?.teams?.home?.id ?? currentMatch?.homeTeamId,
    name: fixture?.teams?.home?.name || currentMatch?.homeTeam?.name || t('pages.matchDetails.homeTeamFallback'),
    logo: fixture?.teams?.home?.logo || resolveAssetUrl(currentMatch?.homeTeam?.logo) || FALLBACK_LOGO,
    localId: currentMatch?.homeTeam?.id,
  };

  const awayTeam = {
    id: fixture?.teams?.away?.id ?? currentMatch?.awayTeamId,
    name: fixture?.teams?.away?.name || currentMatch?.awayTeam?.name || t('pages.matchDetails.awayTeamFallback'),
    logo: fixture?.teams?.away?.logo || resolveAssetUrl(currentMatch?.awayTeam?.logo) || FALLBACK_LOGO,
    localId: currentMatch?.awayTeam?.id,
  };

  const statusShort = fixture?.fixture?.status?.short;
  const isLive = statusShort ? LIVE_STATUSES.includes(statusShort) : currentMatch?.status === MatchStatus.IN_PROGRESS;
  const isFinished = statusShort
    ? FINISHED_STATUSES.includes(statusShort)
    : currentMatch?.status === MatchStatus.FINISHED;
  const isScheduled = !isLive && !isFinished;

  const homeGoals = fixture?.goals?.home ?? currentMatch?.homeScore;
  const awayGoals = fixture?.goals?.away ?? currentMatch?.awayScore;
  const matchDate = fixture?.fixture?.date || currentMatch?.matchDate;

  const statistics: StatRow[] = useMemo(() => {
    const response = data?.external?.statistics?.response || [];
    if (!Array.isArray(response) || response.length < 2) {
      return [];
    }

    const homeEntry = response.find((item: any) => item?.team?.id === homeTeam.id) || response[0];
    const awayEntry = response.find((item: any) => item?.team?.id !== homeEntry?.team?.id) || response[1];

    const homeStats: any[] = homeEntry?.statistics || [];
    const awayStats: any[] = awayEntry?.statistics || [];

    const types = Array.from(new Set([...homeStats, ...awayStats].map((item: any) => item?.type).filter(Boolean)));

    return types
      .sort((a, b) => {
        const orderA = STAT_ORDER.indexOf(a);
        const orderB = STAT_ORDER.indexOf(b);
        return (orderA === -1 ? STAT_ORDER.length : orderA) - (orderB === -1 ? STAT_ORDER.length : orderB);
      })
      .map((type) => {
        const homeValue = homeStats.find((item: any) => item?.type === type)?.value;
        const awayValue = awayStats.find((item: any) => item?.type === type)?.value;
        const homeNumber = toStatNumber(homeValue);
        const awayNumber = toStatNumber(awayValue);
        const total = homeNumber + awayNumber;

        return {
          type,
          label: STAT_LABELS[type] ? t(STAT_LABELS[type]) : type,
          home: toStatText(homeValue),
          away: toStatText(awayValue),
          homeShare: total ? Math.round((homeNumber / total) * 100) : 50,
          awayShare: total ? 100 - Math.round((homeNumber / total) * 100) : 50,
        };
      })
      .filter((row) => row.home !== '0' || row.away !== '0');
  }, [data, homeTeam.id, t]);

  const lineups = useMemo(() => {
    const response = data?.external?.lineups?.response || [];
    if (!Array.isArray(response) || !response.length) {
      return [];
    }

    const ordered = [...response].sort((a: any, b: any) => {
      if (a?.team?.id === homeTeam.id) {
        return -1;
      }

      if (b?.team?.id === homeTeam.id) {
        return 1;
      }

      return 0;
    });

    return ordered.map((item: any) => ({
      teamId: item?.team?.id,
      teamName: item?.team?.name || '',
      teamLogo: item?.team?.logo || FALLBACK_LOGO,
      formation: item?.formation || '',
      coach: item?.coach?.name || '',
      startXI: (item?.startXI || []).map((entry: any) => entry?.player).filter(Boolean),
      substitutes: (item?.substitutes || []).map((entry: any) => entry?.player).filter(Boolean),
    }));
  }, [data, homeTeam.id]);

  const events = useMemo(() => {
    const response = data?.external?.events?.response || [];
    if (!Array.isArray(response)) {
      return [];
    }

    return response
      .filter((item: any) => !!item)
      .map((item: any, index: number) => {
        const type = String(item?.type || '');
        const detail = String(item?.detail || '');
        const normalizedType = type.toLowerCase();

        let tone = 'eventNeutral';
        let label = detail || type;

        if (normalizedType === 'goal') {
          tone = detail === 'Missed Penalty' ? 'eventMiss' : 'eventGoal';
          label = GOAL_DETAILS[detail] ? t(GOAL_DETAILS[detail]) : t('pages.matchDetails.event.goal');
        } else if (normalizedType === 'card') {
          tone = detail === 'Yellow Card' ? 'eventYellow' : 'eventRed';
          label = CARD_DETAILS[detail] ? t(CARD_DETAILS[detail]) : t('pages.matchDetails.event.card');
        } else if (normalizedType === 'subst') {
          tone = 'eventSubst';
          label = t('pages.matchDetails.event.substitution');
        } else if (normalizedType === 'var') {
          tone = 'eventVar';
          label = t('pages.matchDetails.event.varWithDetail', undefined, { detail });
        }

        const elapsed = Number(item?.time?.elapsed);
        const extra = Number(item?.time?.extra);

        return {
          key: `${index}-${item?.time?.elapsed}-${item?.player?.id || item?.player?.name || ''}`,
          minute: Number.isFinite(elapsed) ? `${elapsed}${Number.isFinite(extra) && extra ? `+${extra}` : ''}'` : '',
          sortKey: (Number.isFinite(elapsed) ? elapsed : 0) + (Number.isFinite(extra) ? extra / 100 : 0),
          isHome: item?.team?.id === homeTeam.id,
          type: normalizedType,
          tone,
          label,
          player: item?.player?.name || '',
          assist: item?.assist?.name || '',
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [data, homeTeam.id, t]);

  const renderEventIcon = (type: string) => {
    if (type === 'goal') {
      return <BallIcon />;
    }

    if (type === 'card') {
      return <CardIcon />;
    }

    if (type === 'subst') {
      return <SubstIcon />;
    }

    if (type === 'var') {
      return <VarIcon />;
    }

    return <BallIcon />;
  };

  const renderTeam = (team: typeof homeTeam) => (
    <div className={styles.heroTeam}>
      <span className={styles.heroTeamLogo}>
        <img
          src={team.logo}
          alt={team.name}
          onError={(event) => {
            event.currentTarget.src = FALLBACK_LOGO;
          }}
        />
      </span>

      {team.localId ? (
        <Link to={`/tournament/${tournamentId}/team/${team.localId}`} className={styles.heroTeamLink} title={team.name}>
          {team.name}
        </Link>
      ) : (
        <span className={styles.heroTeamName} title={team.name}>
          {team.name}
        </span>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className={styles.page}>
        <span className={cn(styles.skeletonBlock, styles.skeletonRow)} />
        <span className={cn(styles.skeletonBlock, styles.skeletonHero)} />
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 4 }, (_, index) => (
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
          {t('pages.matchDetails.backToMatches')}
        </Link>

        <div className={styles.topBarActions}>
          {!!lastUpdated && (
            <span className={styles.chip}>
              {t('pages.matchDetails.updatedAt', undefined, {
                time: lastUpdated.toLocaleTimeString(lang === 'ua' ? 'uk-UA' : 'en-US'),
              })}
            </span>
          )}

          <button
            type="button"
            className={cn(styles.refreshButton, { [styles.refreshButtonBusy]: isRefreshing })}
            onClick={() => void handleRefresh()}
            disabled={isRefreshing || !fixtureId}>
            <RefreshIcon />
            {isRefreshing ? t('pages.matchDetails.refreshing') : t('pages.matchDetails.refresh')}
          </button>
        </div>
      </div>

      <header className={cn(styles.hero, { [styles.heroLive]: isLive })}>
        <span className={styles.heroGlow} aria-hidden />

        <div className={styles.heroTop}>
          {isLive ? (
            <span className={cn(styles.heroBadge, styles.heroBadgeLive)}>
              <span className={styles.liveDot} />
              {t('pages.status.live')}
              {fixture?.fixture?.status?.elapsed ? ` · ${fixture.fixture.status.elapsed}'` : ''}
            </span>
          ) : (
            <span className={styles.heroBadge}>
              {isFinished
                ? t('pages.status.completed')
                : matchDate
                  ? normalizeMatchTime(matchDate)
                  : t('pages.status.scheduled')}
            </span>
          )}

          {!!fixture?.league?.name && (
            <span className={styles.heroBadge}>
              {fixture.league.name}
              {fixture.league.round ? ` · ${fixture.league.round}` : ''}
            </span>
          )}

          {!!matchDate && <span className={styles.heroBadge}>{normalizeMatchDate(matchDate)}</span>}
        </div>

        <div className={styles.heroBody}>
          {renderTeam(homeTeam)}

          <div className={styles.heroScore}>
            {isScheduled && homeGoals === undefined ? (
              <span className={styles.heroKickoff}>
                {matchDate ? normalizeMatchTime(matchDate) : t('pages.matchDetails.vs')}
              </span>
            ) : (
              <div className={cn(styles.scoreLine, { [styles.scoreLive]: isLive })}>
                <span className={styles.scoreValue}>{homeGoals ?? '-'}</span>
                <span className={styles.scoreDash}>:</span>
                <span className={styles.scoreValue}>{awayGoals ?? '-'}</span>
              </div>
            )}

            <div className={styles.scoreMeta}>
              {!!fixture?.score?.halftime && fixture.score.halftime.home !== null && (
                <span className={styles.scoreMetaItem}>
                  {t('pages.matchDetails.halftimeScore', undefined, {
                    home: fixture.score.halftime.home,
                    away: fixture.score.halftime.away,
                  })}
                </span>
              )}
              {!!fixture?.score?.penalty && fixture.score.penalty.home !== null && (
                <span className={styles.scoreMetaItem}>
                  {t('pages.matchDetails.penaltyScore', undefined, {
                    home: fixture.score.penalty.home,
                    away: fixture.score.penalty.away,
                  })}
                </span>
              )}
            </div>
          </div>

          {renderTeam(awayTeam)}
        </div>

        {(!!fixture?.fixture?.venue?.name || !!fixture?.fixture?.referee) && (
          <div className={styles.heroFoot}>
            {!!fixture?.fixture?.venue?.name && (
              <span className={styles.heroTag}>
                {fixture.fixture.venue.name}
                {fixture.fixture.venue.city ? `, ${fixture.fixture.venue.city}` : ''}
              </span>
            )}
            {!!fixture?.fixture?.referee && (
              <span className={styles.heroTag}>
                {t('pages.matchDetails.referee', undefined, { name: fixture.fixture.referee })}
              </span>
            )}
          </div>
        )}
      </header>

      {(!fixtureId || !data?.hasExternalData) && (
        <div className={styles.emptyCard}>
          <span className={styles.emptyIcon}>
            <EmptyIcon />
          </span>
          <h3 className={styles.emptyTitle}>{t('pages.matchDetails.emptyTitle')}</h3>
        </div>
      )}

      {!!statistics.length && (
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}>
              <ChartIcon />
            </span>
            <div className={styles.sectionHeadText}>
              <h3 className={styles.sectionTitle}>{t('pages.matchDetails.statsTitle')}</h3>
              <p className={styles.sectionMeta}>
                {t('pages.matchDetails.versus', undefined, { home: homeTeam.name, away: awayTeam.name })}
              </p>
            </div>
          </div>

          <div className={styles.statList}>
            {statistics.map((row) => (
              <div key={row.type} className={styles.statRow}>
                <span className={cn(styles.statValue, styles.statValueHome)}>{row.home}</span>
                <div className={styles.statCenter}>
                  <span className={styles.statLabel}>{row.label}</span>
                  <div className={styles.statBar}>
                    <span
                      className={cn(styles.statBarPart, styles.statBarHome)}
                      style={{ width: `${row.homeShare}%` }}
                    />
                    <span
                      className={cn(styles.statBarPart, styles.statBarAway)}
                      style={{ width: `${row.awayShare}%` }}
                    />
                  </div>
                </div>
                <span className={cn(styles.statValue, styles.statValueAway)}>{row.away}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {!!events.length && (
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}>
              <ClockIcon />
            </span>
            <div className={styles.sectionHeadText}>
              <h3 className={styles.sectionTitle}>{t('pages.matchDetails.timelineTitle')}</h3>
              <p className={styles.sectionMeta}>{t('pages.matchDetails.timelineMeta')}</p>
            </div>
            <span className={styles.sectionCount}>{events.length}</span>
          </div>

          <ol className={styles.timeline}>
            {events.map((event) => (
              <li
                key={event.key}
                className={cn(styles.timelineItem, {
                  [styles.timelineHome]: event.isHome,
                  [styles.timelineAway]: !event.isHome,
                })}>
                <div className={styles.timelineSlot}>
                  {event.isHome && (
                    <div className={cn(styles.eventCard, styles[event.tone])}>
                      <span className={styles.eventIcon}>{renderEventIcon(event.type)}</span>
                      <div className={styles.eventText}>
                        <p className={styles.eventPlayer}>{event.player || event.label}</p>
                        <p className={styles.eventDetail}>
                          {event.label}
                          {event.assist ? ` · ${event.assist}` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <span className={styles.timelineMinute}>{event.minute}</span>

                <div className={styles.timelineSlot}>
                  {!event.isHome && (
                    <div className={cn(styles.eventCard, styles[event.tone])}>
                      <span className={styles.eventIcon}>{renderEventIcon(event.type)}</span>
                      <div className={styles.eventText}>
                        <p className={styles.eventPlayer}>{event.player || event.label}</p>
                        <p className={styles.eventDetail}>
                          {event.label}
                          {event.assist ? ` · ${event.assist}` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!!lineups.length && (
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}>
              <UsersIcon />
            </span>
            <div className={styles.sectionHeadText}>
              <h3 className={styles.sectionTitle}>{t('pages.matchDetails.lineupsTitle')}</h3>
              <p className={styles.sectionMeta}>{t('pages.matchDetails.lineupsMeta')}</p>
            </div>
          </div>

          <div className={styles.lineupsGrid}>
            {lineups.map((lineup) => (
              <div key={lineup.teamId || lineup.teamName} className={styles.lineupCard}>
                <div className={styles.lineupHead}>
                  <span className={styles.lineupLogo}>
                    <img
                      src={lineup.teamLogo}
                      alt={lineup.teamName}
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_LOGO;
                      }}
                    />
                  </span>
                  <div className={styles.lineupHeadText}>
                    <p className={styles.lineupTeam}>{lineup.teamName}</p>
                    {!!lineup.coach && (
                      <p className={styles.lineupCoach}>
                        {t('pages.matchDetails.coach', undefined, { name: lineup.coach })}
                      </p>
                    )}
                  </div>
                  {!!lineup.formation && <span className={styles.formationChip}>{lineup.formation}</span>}
                </div>

                {!!lineup.startXI.length && (
                  <>
                    <p className={styles.lineupGroupTitle}>{t('pages.matchDetails.startingLineup')}</p>
                    <ul className={styles.playerList}>
                      {lineup.startXI.map((player: any) => (
                        <li key={player.id || player.name} className={styles.playerRow}>
                          <span className={styles.playerNumber}>{player.number ?? '—'}</span>
                          <span className={styles.playerName}>{player.name}</span>
                          {!!player.pos && (
                            <span className={styles.playerPos}>
                              {POSITION_LABELS[player.pos] ? t(POSITION_LABELS[player.pos]) : player.pos}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {!!lineup.substitutes.length && (
                  <>
                    <p className={styles.lineupGroupTitle}>{t('pages.matchDetails.substitutes')}</p>
                    <ul className={styles.playerList}>
                      {lineup.substitutes.map((player: any) => (
                        <li key={player.id || player.name} className={cn(styles.playerRow, styles.playerRowMuted)}>
                          <span className={styles.playerNumber}>{player.number ?? '—'}</span>
                          <span className={styles.playerName}>{player.name}</span>
                          {!!player.pos && (
                            <span className={styles.playerPos}>
                              {POSITION_LABELS[player.pos] ? t(POSITION_LABELS[player.pos]) : player.pos}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MatchDetails;
