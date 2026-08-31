import { useMemo, useState } from 'react';
import cn from 'classnames';
import { useAppSelector } from 'store';
import { useTournament } from '../../Tournament';
import { IMatch, IStandingsItem, MatchStatus } from 'interfaces';
import { useMobile } from 'hooks';
import { getLeagueLabel, resolveAssetUrl } from 'helpers';
import styles from './Standings.module.scss';
import { useI18n } from 'i18n';

type Zone = 'playoff' | 'knockout' | 'promotion' | 'promotionPlayoff' | 'relegationPlayoff' | 'relegation' | null;

type GroupEntry = {
  key: string;
  group: string;
  items: IStandingsItem[];
};

type LeagueSection = {
  key: string;
  label: string;
  groups: GroupEntry[];
  teams: number;
};

type StandingsTableProps = {
  title: string;
  meta?: string;
  badge?: string;
  items: IStandingsItem[];
  isMobile: boolean;
  getZone: (index: number) => Zone;
  formLimit?: number;
};

const LEAGUE_TONES = ['toneA', 'toneB', 'toneC', 'toneD'];

const GROUP_KEY_PATTERN = /^(?:L(?:eague)?\s*)?([A-Za-z]|\d{1,2})\s*[:|\-–_/]\s*(?:G(?:roup)?\s*)?(.+)$/i;

const toLeagueLabel = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return getLeagueLabel(numeric);
  }

  return String(value).trim().toUpperCase();
};

const normalizeGroupName = (value: string) =>
  value.replace(/^(group|\u0433\u0440\u0443\u043f\u0430|\u0433\u0440\.?)\s*/i, '').trim() || value.trim();

const parseGroupKey = (key: string, items: IStandingsItem[]) => {
  const [first] = items;
  const matched = key.match(GROUP_KEY_PATTERN);

  return {
    league: toLeagueLabel(first?.league || matched?.[1]),
    group: normalizeGroupName(first?.group || matched?.[2] || key),
  };
};

const getLeagueSortOrder = (label: string): number => {
  const raw = (label || '').trim().toUpperCase();
  if (!raw) {
    return Number.MAX_SAFE_INTEGER;
  }

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  const code = raw.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return code - 64;
  }

  return Number.MAX_SAFE_INTEGER;
};

const TableIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.heroEyebrowIcon}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <path d="M3.5 9.5h17M3.5 14.5h17M9 9.5V19.5" />
  </svg>
);

const StandingsTable: React.FC<StandingsTableProps> = ({ title, meta, badge, items, isMobile, getZone, formLimit }) => {
  const { t } = useI18n();

  const formTitleMap: Record<string, string> = {
    won: t('pages.standings.wonTitle'),
    drawn: t('pages.standings.drawTitle'),
    lost: t('pages.standings.lostTitle'),
  };

  return (
    <section className={styles.tableCard}>
      <header className={styles.tableHead}>
        {badge && <span className={styles.groupBadge}>{badge}</span>}
        <div className={styles.tableHeadText}>
          <h3 className={styles.tableTitle}>{title}</h3>
          {meta && <p className={styles.tableMeta}>{meta}</p>}
        </div>
        <span className={styles.tableCount}>{t('pages.standings.teams', undefined, { count: items.length })}</span>
      </header>

      <div className={styles.tableInner}>
        <div className={cn(styles.row, styles.headRow)}>
          <div className={styles.colPos}>#</div>
          <div className={styles.colTeam}>{t('pages.standings.team')}</div>
          <div className={styles.stats}>
            <p className={styles.col}>{isMobile ? t('pages.standings.matchesShort') : t('pages.standings.matches')}</p>
            <p className={cn(styles.col, styles.hideMobile)} title={t('pages.standings.wonTitle')}>
              {t('pages.standings.won')}
            </p>
            <p className={cn(styles.col, styles.hideMobile)} title={t('pages.standings.drawTitle')}>
              {t('pages.standings.draw')}
            </p>
            <p className={cn(styles.col, styles.hideMobile)} title={t('pages.standings.lostTitle')}>
              {t('pages.standings.lost')}
            </p>
            <p className={styles.col}>{t('pages.standings.goals')}</p>
            <p className={cn(styles.col, styles.colForm)}>
              {isMobile ? t('pages.standings.formShort') : t('pages.standings.form')}
            </p>
            <p className={cn(styles.col, styles.colPoints)}>
              {isMobile ? t('pages.standings.pointsShort') : t('pages.standings.points')}
            </p>
          </div>
        </div>

        {items.map((item, index) => {
          const zone = getZone(index);
          const form = typeof formLimit === 'number' ? item.form.slice(formLimit) : item.form;

          return (
            <div className={cn(styles.row, zone ? styles[zone] : '', { [styles.zoneRow]: !!zone })} key={item.id}>
              <div className={styles.colPos}>
                <span className={cn(styles.position, { [styles.positionZone]: !!zone })}>{index + 1}</span>
              </div>
              <div className={styles.colTeam}>
                <span className={styles.teamLogo}>
                  <img src={resolveAssetUrl(item.logo)} alt={item.team} />
                </span>
                <p className={styles.teamName} title={item.team}>
                  {item.team}
                </p>
              </div>
              <div className={styles.stats}>
                <p className={styles.col}>{item.played}</p>
                <p className={cn(styles.col, styles.hideMobile, styles.statWon)}>{item.won}</p>
                <p className={cn(styles.col, styles.hideMobile)}>{item.drawn}</p>
                <p className={cn(styles.col, styles.hideMobile, styles.statLost)}>{item.lost}</p>
                <p className={styles.col}>
                  <span className={styles.goals}>{`${item.goalsScored}:${item.goalsAgainst}`}</span>
                </p>
                <div className={cn(styles.col, styles.colForm)}>
                  <div className={styles.form}>
                    {form.map((result, formIndex) => (
                      <span
                        key={formIndex}
                        className={cn(styles.formItem, styles[result])}
                        title={formTitleMap[result] || result}
                      />
                    ))}
                  </div>
                </div>
                <p className={cn(styles.col, styles.colPoints)}>
                  <span className={styles.points}>{item.points}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const Standings: React.FC = () => {
  const { t } = useI18n();
  const { tournament } = useTournament();
  const isMobile = useMobile();
  const [activeLeague, setActiveLeague] = useState<string | null>(null);

  const standings = useAppSelector((state) => state.tournament.standings)[tournament.id];
  const matchesByTournament = useAppSelector((state) => state.match.matches);

  const fallbackStandings = useMemo<Record<string, IStandingsItem[]>>(() => {
    const matches = matchesByTournament[tournament.id] || [];
    const allMatches = matches.flatMap((stage) => stage.data || []);
    if (!allMatches.length) {
      return {};
    }

    const getSectionMeta = (match: IMatch) => {
      const leagueLabel = tournament.leagues > 1 ? getLeagueLabel(Number(match.tournamentLeague) || 1) : '';
      const groupLabel = (match.groupName || '').trim() || t('pages.standings.overallGroup');
      return {
        sectionKey: `${leagueLabel}::${groupLabel}`,
        leagueLabel,
        groupLabel,
      };
    };

    const sections = new Map<string, Map<number, IStandingsItem>>();

    const addTeam = (match: IMatch, type: 'home' | 'away') => {
      const team = type === 'home' ? match.homeTeam : match.awayTeam;
      const teamId = type === 'home' ? match.homeTeamId : match.awayTeamId;

      if (!teamId || !team?.name) {
        return;
      }

      const { sectionKey, leagueLabel, groupLabel } = getSectionMeta(match);

      if (!sections.has(sectionKey)) {
        sections.set(sectionKey, new Map());
      }

      const section = sections.get(sectionKey)!;
      if (!section.has(teamId)) {
        section.set(teamId, {
          id: String(teamId),
          name: team.name,
          team: team.name,
          logo: team.logo || '',
          league: leagueLabel || undefined,
          group: groupLabel,
          played: 0,
          won: 0,
          lost: 0,
          drawn: 0,
          goalsScored: 0,
          goalsAgainst: 0,
          points: 0,
          form: [],
        } as IStandingsItem);
      }
    };

    const applyCountedMatch = (match: IMatch) => {
      if (match.status !== MatchStatus.FINISHED && match.status !== MatchStatus.IN_PROGRESS) {
        return;
      }

      const { sectionKey } = getSectionMeta(match);
      const section = sections.get(sectionKey);
      if (!section) {
        return;
      }

      const home = section.get(match.homeTeamId);
      const away = section.get(match.awayTeamId);
      if (!home || !away) {
        return;
      }

      const homeScore = Number(match.homeScore) || 0;
      const awayScore = Number(match.awayScore) || 0;

      home.played += 1;
      away.played += 1;
      home.goalsScored += homeScore;
      home.goalsAgainst += awayScore;
      away.goalsScored += awayScore;
      away.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        home.won += 1;
        home.points += 3;
        home.form.push('won');

        away.lost += 1;
        away.form.push('lost');
        return;
      }

      if (homeScore < awayScore) {
        away.won += 1;
        away.points += 3;
        away.form.push('won');

        home.lost += 1;
        home.form.push('lost');
        return;
      }

      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
      home.form.push('drawn');
      away.form.push('drawn');
    };

    allMatches.forEach((match) => {
      addTeam(match, 'home');
      addTeam(match, 'away');
    });

    const finishedMatches = [...allMatches].sort(
      (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime(),
    );
    finishedMatches.forEach(applyCountedMatch);

    const result: Record<string, IStandingsItem[]> = {};
    sections.forEach((teams, key) => {
      const items = Array.from(teams.values())
        .map((team) => ({
          ...team,
          form: team.form.slice(-5),
        }))
        .sort((a, b) => {
          const byPoints = b.points - a.points;
          if (byPoints !== 0) {
            return byPoints;
          }

          const byGoalDiff = b.goalsScored - b.goalsAgainst - (a.goalsScored - a.goalsAgainst);
          if (byGoalDiff !== 0) {
            return byGoalDiff;
          }

          const byGoals = b.goalsScored - a.goalsScored;
          if (byGoals !== 0) {
            return byGoals;
          }

          return a.team.localeCompare(b.team, 'uk', { sensitivity: 'base' });
        });

      if (items.length) {
        result[key] = items;
      }
    });

    return result;
  }, [matchesByTournament, t, tournament.id, tournament.leagues]);

  const hasLiveMatches = useMemo(() => {
    const matches = matchesByTournament[tournament.id] || [];
    return matches.some((stage) => (stage.data || []).some((match) => match.status === MatchStatus.IN_PROGRESS));
  }, [matchesByTournament, tournament.id]);

  const effectiveStandings = useMemo(() => {
    const serverStandings = standings?.standings || {};

    // While there are live matches, show a provisional table from current match scores.
    if (hasLiveMatches && Object.keys(fallbackStandings).length) {
      return fallbackStandings;
    }

    return Object.keys(serverStandings).length ? serverStandings : fallbackStandings;
  }, [standings, fallbackStandings, hasLiveMatches]);

  const groups = useMemo(() => Object.entries(effectiveStandings), [effectiveStandings]);
  const thirdPlace = useMemo(() => standings?.thirdPlacesStandings || [], [standings]);
  const isNationsLeague = !!tournament.isNationsLeague;

  const leagues = useMemo<LeagueSection[]>(() => {
    const sections = new Map<string, LeagueSection>();

    groups.forEach(([key, groupItems]) => {
      const items = groupItems as unknown as IStandingsItem[];
      const parsed = parseGroupKey(key, items);
      const leagueKey = parsed.league || '';
      const section = sections.get(leagueKey) || { key: leagueKey, label: parsed.league || '', groups: [], teams: 0 };

      section.groups.push({ key, group: parsed.group, items });
      section.teams += items.length;
      sections.set(leagueKey, section);
    });

    return Array.from(sections.values())
      .map((section) => ({
        ...section,
        groups: [...section.groups].sort((a, b) => a.group.localeCompare(b.group, 'uk', { numeric: true })),
      }))
      .sort((a, b) => {
        const byOrder = getLeagueSortOrder(a.label) - getLeagueSortOrder(b.label);
        if (byOrder !== 0) {
          return byOrder;
        }

        return a.label.localeCompare(b.label, 'uk', { numeric: true });
      });
  }, [groups]);

  // League count comes from backend, UI groups are built from standings data.
  const isMultiLeague = tournament.leagues > 1 && leagues.length > 1 && leagues.every((section) => !!section.label);
  const topLeagueKey = isMultiLeague ? leagues[0].key : null;
  const visibleLeagues = activeLeague ? leagues.filter((section) => section.key === activeLeague) : leagues;

  const allTeams = groups.flatMap(([, items]) => items as unknown as IStandingsItem[]);
  const overview = {
    leagues: leagues.length,
    groups: groups.length,
    teams: allTeams.length,
    matches: Math.floor(allTeams.reduce((acc, item) => acc + item.played, 0) / 2),
    goals: allTeams.reduce((acc, item) => acc + item.goalsScored, 0),
  };

  const directSlots = Number(tournament.championsSlots || tournament.directNextRound || 0);
  const playoffSlots = Number(tournament.europaSlots || tournament.playoffRound || 0);
  const isChampionsLeagueLeaguePhase =
    !isNationsLeague &&
    tournament.groupNumber === 1 &&
    tournament.leagues <= 1 &&
    directSlots === 8 &&
    playoffSlots === 16;
  const relegationSlots = isChampionsLeagueLeaguePhase ? 0 : Number(tournament.relegationSlots || 0);
  const hasDirectZone = directSlots > 0;
  const hasPlayoffZone = playoffSlots > 0;
  const hasRelegationZone = relegationSlots > 0;

  const directZoneLabel = isChampionsLeagueLeaguePhase
    ? t('pages.standings.legend.roundOf16')
    : t('pages.standings.legend.championsLeague');
  const playoffZoneLabel = isChampionsLeagueLeaguePhase
    ? t('pages.standings.legend.knockoutPlayoff')
    : t('pages.standings.legend.europaLeague');
  const relegationZoneLabel = isChampionsLeagueLeaguePhase
    ? t('pages.standings.legend.eliminated')
    : t('pages.standings.legend.lastRelegation', undefined, { count: relegationSlots });

  const thirdPlaceSections = useMemo<LeagueSection[]>(() => {
    if (!thirdPlace.length) {
      return [];
    }

    const single = [
      { key: '', label: '', teams: thirdPlace.length, groups: [{ key: '3', group: '3', items: thirdPlace }] },
    ];
    if (!isMultiLeague || thirdPlace.some((item) => !toLeagueLabel(item.league))) {
      return single;
    }

    const sections = new Map<string, LeagueSection>();
    thirdPlace.forEach((item) => {
      const label = toLeagueLabel(item.league) as string;
      const section = sections.get(label) || {
        key: label,
        label,
        groups: [{ key: label, group: '3', items: [] }],
        teams: 0,
      };

      section.groups[0].items.push(item);
      section.teams += 1;
      sections.set(label, section);
    });

    return Array.from(sections.values()).sort((a, b) => a.label.localeCompare(b.label, 'uk', { numeric: true }));
  }, [isMultiLeague, thirdPlace]);

  const getGroupZone = (leagueKey: string | null, index: number, tableSize?: number): Zone => {
    if (isNationsLeague && isMultiLeague) {
      const leagueSection = leagues.find((section) => section.key === (leagueKey || ''));
      const leagueOrder = getLeagueSortOrder(leagueSection?.label || leagueKey || '');
      const maxLeagueOrder = Math.max(1, Number(tournament.leagues) || 1);
      const isTopLeague = leagueOrder === 1;
      const isBottomLeague = leagueOrder >= maxLeagueOrder;
      const position = index + 1;

      if (isTopLeague) {
        if (position <= 2) {
          return 'playoff';
        }
        if (position === 3) {
          return 'relegationPlayoff';
        }
        if (position === 4) {
          return 'relegation';
        }
        return null;
      }

      if (position === 1) {
        return 'promotion';
      }
      if (position === 2) {
        return 'promotionPlayoff';
      }
      if (!isBottomLeague && position === 3) {
        return 'relegationPlayoff';
      }
      if (!isBottomLeague && position === 4) {
        return 'relegation';
      }

      return null;
    }

    if (isMultiLeague && leagueKey !== topLeagueKey) {
      return null;
    }

    const position = index + 1;

    if (position <= directSlots) {
      return 'playoff';
    }

    if (position <= directSlots + playoffSlots) {
      return 'knockout';
    }

    if (
      typeof tableSize === 'number' &&
      relegationSlots > 0 &&
      tableSize > 0 &&
      position > tableSize - relegationSlots
    ) {
      return 'relegation';
    }

    return null;
  };

  const renderLeagueLegend = (section: LeagueSection) => {
    if (!isNationsLeague) {
      if (section.key !== topLeagueKey || (!hasDirectZone && !hasPlayoffZone && !hasRelegationZone)) {
        return null;
      }

      return (
        <div className={cn(styles.legend, styles.leagueLegend)}>
          {hasDirectZone && (
            <span className={cn(styles.legendItem, styles.playoff)}>
              <span className={styles.legendDot} />
              {directZoneLabel}
            </span>
          )}
          {hasPlayoffZone && (
            <span className={cn(styles.legendItem, styles.knockout)}>
              <span className={styles.legendDot} />
              {playoffZoneLabel}
            </span>
          )}
          {hasRelegationZone && (
            <span className={cn(styles.legendItem, styles.relegation)}>
              <span className={styles.legendDot} />
              {relegationZoneLabel}
            </span>
          )}
          <span className={styles.legendHint}>{t('pages.standings.legend.qualificationHint')}</span>
        </div>
      );
    }

    const leagueOrder = getLeagueSortOrder(section.label || section.key);
    const maxLeagueOrder = Math.max(1, Number(tournament.leagues) || 1);
    const isTopLeague = leagueOrder === 1;
    const isBottomLeague = leagueOrder >= maxLeagueOrder;

    return (
      <div className={cn(styles.legend, styles.leagueLegend)}>
        {isTopLeague ? (
          <>
            <span className={cn(styles.legendItem, styles.playoff)}>
              <span className={styles.legendDot} />
              {t('pages.standings.legend.nations.topPlayoff')}
            </span>
            <span className={cn(styles.legendItem, styles.relegationPlayoff)}>
              <span className={styles.legendDot} />
              {t('pages.standings.legend.nations.topRelegationPlayoff')}
            </span>
            <span className={cn(styles.legendItem, styles.relegation)}>
              <span className={styles.legendDot} />
              {t('pages.standings.legend.nations.topRelegation')}
            </span>
          </>
        ) : (
          <>
            <span className={cn(styles.legendItem, styles.promotion)}>
              <span className={styles.legendDot} />
              {t('pages.standings.legend.nations.lowerPromotion')}
            </span>
            <span className={cn(styles.legendItem, styles.promotionPlayoff)}>
              <span className={styles.legendDot} />
              {t('pages.standings.legend.nations.lowerPromotionPlayoff')}
            </span>
            {!isBottomLeague && (
              <span className={cn(styles.legendItem, styles.relegationPlayoff)}>
                <span className={styles.legendDot} />
                {t('pages.standings.legend.nations.lowerRelegationPlayoff')}
              </span>
            )}
            {!isBottomLeague && (
              <span className={cn(styles.legendItem, styles.relegation)}>
                <span className={styles.legendDot} />
                {t('pages.standings.legend.nations.lowerRelegation')}
              </span>
            )}
          </>
        )}
      </div>
    );
  };

  const renderGroupTable = (entry: GroupEntry, section?: LeagueSection) => {
    const isSingleTable = tournament.groupNumber === 1;
    const inLeague = !!section?.label;
    const title = isSingleTable
      ? t('pages.standings.title')
      : t('pages.standings.group', undefined, { group: entry.group });
    const meta = inLeague
      ? `${tournament.name} • ${t('pages.standings.league', undefined, { label: section?.label || '' })}`
      : tournament.name;

    return (
      <StandingsTable
        key={entry.key}
        title={title}
        meta={meta}
        badge={isSingleTable ? undefined : entry.group}
        items={entry.items}
        isMobile={isMobile}
        formLimit={isMobile ? -3 : undefined}
        getZone={(index) => getGroupZone(section?.key ?? null, index, entry.items.length)}
      />
    );
  };

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <span className={styles.heroEyebrow}>
              <TableIcon />
              {t('pages.standings.title')}
            </span>
            <h2 className={styles.heroTitle}>{tournament.name}</h2>
            <p className={styles.heroSubtitle}>
              {isMultiLeague ? t('pages.standings.subtitleMulti') : t('pages.standings.subtitleSingle')}
            </p>
          </div>

          {!!allTeams.length && (
            <div className={styles.heroMetrics}>
              {isMultiLeague && (
                <div className={styles.heroMetric}>
                  <span className={styles.heroMetricValue}>{overview.leagues}</span>
                  <span className={styles.heroMetricLabel}>{t('pages.standings.metrics.leagues')}</span>
                </div>
              )}
              {tournament.groupNumber > 1 && (
                <div className={styles.heroMetric}>
                  <span className={styles.heroMetricValue}>{overview.groups}</span>
                  <span className={styles.heroMetricLabel}>{t('pages.standings.metrics.groups')}</span>
                </div>
              )}
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.teams}</span>
                <span className={styles.heroMetricLabel}>{t('pages.standings.metrics.teams')}</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.matches}</span>
                <span className={styles.heroMetricLabel}>{t('pages.standings.metrics.matches')}</span>
              </div>
              {!isMultiLeague && (
                <div className={styles.heroMetric}>
                  <span className={styles.heroMetricValue}>{overview.goals}</span>
                  <span className={styles.heroMetricLabel}>{t('pages.standings.metrics.goals')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {isMultiLeague && (
        <div className={styles.leagueFilter}>
          <button
            type="button"
            className={cn(styles.leagueTab, { [styles.leagueTabActive]: !activeLeague })}
            onClick={() => setActiveLeague(null)}>
            {t('pages.standings.allLeagues')}
          </button>
          {leagues.map((section, index) => (
            <button
              type="button"
              key={section.key}
              className={cn(styles.leagueTab, styles[LEAGUE_TONES[index % LEAGUE_TONES.length]], {
                [styles.leagueTabActive]: activeLeague === section.key,
              })}
              onClick={() => setActiveLeague(section.key)}>
              <span className={styles.leagueTabDot} />
              {t('pages.standings.league', undefined, { label: section.label })}
            </button>
          ))}
        </div>
      )}

      {!!allTeams.length &&
        !isMultiLeague &&
        (isNationsLeague || hasDirectZone || hasPlayoffZone || hasRelegationZone) && (
          <div className={styles.legend}>
            {isNationsLeague ? (
              <>
                <span className={cn(styles.legendItem, styles.playoff)}>
                  <span className={styles.legendDot} />
                  {t('pages.standings.legend.nations.singleTop')}
                </span>
                <span className={cn(styles.legendItem, styles.relegationPlayoff)}>
                  <span className={styles.legendDot} />
                  {t('pages.standings.legend.nations.singleRelegationPlayoff')}
                </span>
                <span className={cn(styles.legendItem, styles.relegation)}>
                  <span className={styles.legendDot} />
                  {t('pages.standings.legend.nations.singleRelegation')}
                </span>
                <span className={cn(styles.legendItem, styles.promotion)}>
                  <span className={styles.legendDot} />
                  {t('pages.standings.legend.nations.singleLower')}
                </span>
              </>
            ) : (
              <>
                {hasDirectZone && (
                  <span className={cn(styles.legendItem, styles.playoff)}>
                    <span className={styles.legendDot} />
                    {directZoneLabel}
                  </span>
                )}
                {hasPlayoffZone && (
                  <span className={cn(styles.legendItem, styles.knockout)}>
                    <span className={styles.legendDot} />
                    {playoffZoneLabel}
                  </span>
                )}
                {hasRelegationZone && (
                  <span className={cn(styles.legendItem, styles.relegation)}>
                    <span className={styles.legendDot} />
                    {relegationZoneLabel}
                  </span>
                )}
              </>
            )}
            <span className={styles.legendHint}>
              {isNationsLeague
                ? t('pages.standings.legend.nations.formatHint')
                : isMultiLeague
                  ? t('pages.standings.legend.onlyTopLeague', undefined, {
                      league: t('pages.standings.league', undefined, { label: leagues[0].label }),
                    })
                  : t('pages.standings.legend.formHint')}
            </span>
          </div>
        )}

      {!groups.length && (
        <section className={styles.emptyCard}>
          <span className={styles.emptyIcon}>
            <TableIcon />
          </span>
          <h3 className={styles.emptyTitle}>{t('pages.standings.emptyTitle')}</h3>
          <p className={styles.empty}>{t('pages.standings.emptyText')}</p>
        </section>
      )}

      {!!groups.length && isMultiLeague && (
        <div className={styles.leagues}>
          {visibleLeagues.map((section) => {
            const index = leagues.findIndex((item) => item.key === section.key);

            return (
              <section
                className={cn(styles.leagueSection, styles[LEAGUE_TONES[index % LEAGUE_TONES.length]])}
                key={section.key}>
                <header className={styles.leagueHead}>
                  <span className={styles.leagueBadge}>{section.label}</span>
                  <div className={styles.leagueHeadText}>
                    <h3 className={styles.leagueTitle}>
                      {t('pages.standings.league', undefined, { label: section.label })}
                    </h3>
                    <p className={styles.leagueMeta}>
                      {section.groups.length > 1
                        ? `${t('pages.standings.groupsCount', undefined, { count: section.groups.length })} • `
                        : ''}
                      {t('pages.standings.teams', undefined, { count: section.teams })}
                    </p>
                  </div>
                  {section.key === topLeagueKey &&
                    (isNationsLeague || hasDirectZone || hasPlayoffZone || hasRelegationZone) && (
                      <span className={styles.leagueTag}>
                        {isNationsLeague
                          ? t('pages.standings.leagueTagNations')
                          : t('pages.standings.leagueTagPlayoff')}
                      </span>
                    )}
                </header>

                <div className={cn(styles.groups, { [styles.one]: section.groups.length === 1 })}>
                  {section.groups.map((entry) => renderGroupTable(entry, section))}
                </div>

                {renderLeagueLegend(section)}
              </section>
            );
          })}
        </div>
      )}

      {!!groups.length && !isMultiLeague && (
        <div className={cn(styles.groups, { [styles.one]: tournament.groupNumber === 1 })}>
          {leagues.flatMap((section) => section.groups).map((entry) => renderGroupTable(entry))}
        </div>
      )}

      {tournament.type === 'national' && !!thirdPlaceSections.length && (
        <div className={cn(styles.groups, { [styles.one]: thirdPlaceSections.length === 1 })}>
          {thirdPlaceSections.map((section) => (
            <StandingsTable
              key={section.key || 'third'}
              title={
                section.label
                  ? t('pages.standings.thirdPlaceTitleLeague', undefined, {
                      league: t('pages.standings.league', undefined, { label: section.label }),
                    })
                  : t('pages.standings.thirdPlaceTitle')
              }
              meta={tournament.name}
              badge={section.label || undefined}
              items={section.groups[0].items}
              isMobile={isMobile}
              getZone={(index) => (index <= 3 ? 'knockout' : null)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Standings;
