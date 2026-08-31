/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useAppDispatch, useAppSelector } from 'store';
import {
  getLeagueLabel,
  normalizeKnockoutRoundName,
  normalizeMatchDate,
  normalizeMatchDateWithWeekday,
  sliceMatches,
} from 'helpers';
import { IGames, IMatch, MatchStatus } from 'interfaces';
import { toggleOnlyLiveMatches, toggleOnlyScheduledMatches } from 'store/slices/user';
import { useTournament } from '../../Tournament';
import MatchCard from './MatchCard/MatchCard';
import styles from './Matches.module.scss';
import { useI18n } from 'i18n';

type RoundTab = {
  key: string;
  label: string;
  isKnockout: boolean;
  games?: IGames;
};

const LEAGUE_TONES = ['toneA', 'toneB', 'toneC', 'toneD'];

const getMatchLeague = (match: IMatch) => Number(match.tournamentLeague) || 1;

const BallIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.heroEyebrowIcon}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2l2.8 2-1 3.3h-3.6l-1-3.3 2.8-2Z" />
    <path d="M12 3.5v3.7M6.1 9.4l4.1 2.9M17.9 9.4l-4.1 2.9M9.3 15.4 7.6 19M14.7 15.4 16.4 19" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.metaIcon}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <rect x="3.5" y="5.2" width="17" height="15" rx="2.5" />
    <path d="M8 3.2v4M16 3.2v4M3.5 10h17" />
  </svg>
);

const countByStatus = (matches: IMatch[], status: MatchStatus) =>
  matches.filter((match) => match.status === status).length;

type MatchDayGroup = {
  key: string;
  label: string;
  items: IMatch[];
};

const groupMatchesByDay = (items: IMatch[]): MatchDayGroup[] => {
  const groups = new Map<string, MatchDayGroup>();

  items.forEach((match) => {
    const day = new Date(match.matchDate);
    day.setHours(0, 0, 0, 0);

    const key = day.toISOString();
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: normalizeMatchDateWithWeekday(match.matchDate),
        items: [],
      });
    }

    groups.get(key)?.items.push(match);
  });

  return Array.from(groups.values());
};

const Matches: React.FC = () => {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const { tournament } = useTournament();

  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeLeague, setActiveLeague] = useState<number | null>(null);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  const { onlyLiveMatches, onlyScheduledMatches } = useAppSelector((state) => state.user);
  const toggleLiveMatches = () => {
    dispatch(toggleOnlyLiveMatches());
  };
  const toggleScheduledMatches = () => {
    dispatch(toggleOnlyScheduledMatches());
  };

  const matches = useAppSelector((state) => state.match.matches)[tournament.id] || [];
  const { groupMatchNumber, knockoutRound, thirdPlaceMatch } = tournament;
  const knockoutRounds = normalizeKnockoutRoundName(knockoutRound, thirdPlaceMatch);

  const { groupMatches, knockoutMatches } = sliceMatches(matches, groupMatchNumber);

  const rounds = useMemo<RoundTab[]>(() => {
    const groupTabs = groupMatches.map((games, index) => ({
      key: `group-${index}`,
      label: t('pages.matches.round', undefined, { index: index + 1 }),
      isKnockout: false,
      games,
    }));

    if (!knockoutMatches.length) {
      return groupTabs;
    }

    return [
      ...groupTabs,
      ...knockoutRounds.map((label, index) => ({
        key: `knockout-${index}`,
        label,
        isKnockout: true,
        games: knockoutMatches[index],
      })),
    ];
  }, [groupMatchNumber, groupMatches, knockoutMatches, knockoutRound, t, thirdPlaceMatch]);

  // League count comes from backend; tabs are built from leagues that exist in matches.
  const leagues = useMemo(() => {
    if (tournament.leagues <= 1) {
      return [];
    }

    const found = new Set<number>();
    matches.forEach((games) => (games.data || []).forEach((match) => found.add(getMatchLeague(match))));

    return Array.from(found).sort((a, b) => a - b);
  }, [matches, tournament.leagues]);

  const isMultiLeague = leagues.length > 1;
  const filterByLeague = (items: IMatch[]) =>
    isMultiLeague && activeLeague ? items.filter((match) => getMatchLeague(match) === activeLeague) : items;

  const overview = useMemo(() => {
    const allMatches = matches.flatMap((games) => games.data || []);
    const leagueMatches =
      isMultiLeague && activeLeague ? allMatches.filter((match) => getMatchLeague(match) === activeLeague) : allMatches;

    return {
      rounds: rounds.length,
      leagues: leagues.length,
      total: leagueMatches.length,
      live: countByStatus(leagueMatches, MatchStatus.IN_PROGRESS),
      finished: countByStatus(leagueMatches, MatchStatus.FINISHED),
    };
  }, [matches, rounds.length, leagues.length, isMultiLeague, activeLeague]);

  useEffect(() => {
    if (!matches.length) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeIndex = matches.findIndex((round) => {
      if (!round.startDate) {
        return false;
      }

      const roundStart = new Date(round.startDate);
      roundStart.setHours(0, 0, 0, 0);

      const roundEnd = new Date(round.endDate || round.startDate);
      roundEnd.setHours(23, 59, 59, 999);

      return today >= roundStart && today <= roundEnd;
    });

    setActiveTab(activeIndex !== -1 ? activeIndex : 0);
  }, [matches]);

  const renderHero = () => (
    <section className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.heroContent}>
        <div className={styles.heroText}>
          <span className={styles.heroEyebrow}>
            <BallIcon />
            {t('pages.matches.title')}
          </span>
          <h2 className={styles.heroTitle}>{tournament.name}</h2>
          <p className={styles.heroSubtitle}>
            {isMultiLeague ? t('pages.matches.subtitleMulti') : t('pages.matches.subtitleSingle')}
          </p>
        </div>

        {!!overview.total && (
          <div className={cn(styles.heroMetrics, { [styles.heroMetricsWide]: isMultiLeague })}>
            {isMultiLeague && (
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.leagues}</span>
                <span className={styles.heroMetricLabel}>{t('pages.matches.metrics.leagues')}</span>
              </div>
            )}
            <div className={styles.heroMetric}>
              <span className={styles.heroMetricValue}>{overview.rounds}</span>
              <span className={styles.heroMetricLabel}>{t('pages.matches.metrics.rounds')}</span>
            </div>
            <div className={styles.heroMetric}>
              <span className={styles.heroMetricValue}>{overview.total}</span>
              <span className={styles.heroMetricLabel}>{t('pages.matches.metrics.matches')}</span>
            </div>
            <div className={cn(styles.heroMetric, { [styles.heroMetricLive]: overview.live > 0 })}>
              <span className={styles.heroMetricValue}>{overview.live}</span>
              <span className={styles.heroMetricLabel}>{t('pages.status.live')}</span>
            </div>
            <div className={styles.heroMetric}>
              <span className={styles.heroMetricValue}>{overview.finished}</span>
              <span className={styles.heroMetricLabel}>{t('pages.status.completed')}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  if (matches.length === 0) {
    return (
      <div className={styles.page}>
        {renderHero()}
        <section className={styles.emptyCard}>
          <span className={styles.emptyIcon}>
            <CalendarIcon />
          </span>
          <h3 className={styles.emptyTitle}>{t('pages.matches.emptyTitle')}</h3>
          <p className={styles.empty}>{t('pages.matches.emptyText')}</p>
        </section>
      </div>
    );
  }

  const renderMatchesGrid = (items: IMatch[]) => {
    const dayGroups = groupMatchesByDay(items);

    return (
      <div className={styles.matchesByDay}>
        {dayGroups.map((group) => (
          <section className={styles.matchDayGroup} key={group.key}>
            <div className={styles.matchDayDivider}>
              <span className={styles.matchDayLabel}>{group.label}</span>
            </div>
            <div className={styles.matches}>
              {group.items.map((match) => (
                <MatchCard key={match.id} match={match} tournament={tournament} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  };

  const renderLeagueBlocks = (items: IMatch[]) => (
    <div className={styles.leagueBlocks}>
      {leagues.map((league, index) => {
        const leagueMatches = items.filter((match) => getMatchLeague(match) === league);
        if (!leagueMatches.length) {
          return null;
        }

        const leagueLive = countByStatus(leagueMatches, MatchStatus.IN_PROGRESS);

        return (
          <section className={cn(styles.leagueBlock, styles[LEAGUE_TONES[index % LEAGUE_TONES.length]])} key={league}>
            <header className={styles.leagueBlockHead}>
              <span className={styles.leagueBadge}>{getLeagueLabel(league)}</span>
              <div className={styles.leagueBlockText}>
                <h4 className={styles.leagueBlockTitle}>
                  {t('pages.standings.league', undefined, { label: getLeagueLabel(league) })}
                </h4>
                <p className={styles.leagueBlockMeta}>
                  {t('pages.matches.matchesCount', undefined, { count: leagueMatches.length })}
                </p>
              </div>
              {leagueLive > 0 && (
                <span className={cn(styles.chip, styles.chipLive)}>
                  <span className={styles.liveDot} />
                  {t('pages.status.live')} {leagueLive}
                </span>
              )}
            </header>

            {renderMatchesGrid(leagueMatches)}
          </section>
        );
      })}
    </div>
  );

  const renderPanel = (round: RoundTab) => {
    const roundMatches = filterByLeague(round.games?.data || []);
    const liveCount = countByStatus(roundMatches, MatchStatus.IN_PROGRESS);
    const finishedCount = countByStatus(roundMatches, MatchStatus.FINISHED);
    const scheduledCount = countByStatus(roundMatches, MatchStatus.SCHEDULED);
    const visibleMatches = roundMatches.filter((match) => {
      if (onlyLiveMatches && onlyScheduledMatches) {
        return match.status === MatchStatus.IN_PROGRESS || match.status === MatchStatus.SCHEDULED;
      }

      if (onlyLiveMatches) {
        return match.status === MatchStatus.IN_PROGRESS;
      }

      if (onlyScheduledMatches) {
        return match.status === MatchStatus.SCHEDULED;
      }

      return true;
    });

    const startDate = round.games?.startDate;
    const endDate = round.games?.endDate;
    const dateRange =
      startDate && endDate && normalizeMatchDate(startDate) !== normalizeMatchDate(endDate)
        ? `${normalizeMatchDate(startDate)} - ${normalizeMatchDate(endDate)}`
        : startDate
          ? normalizeMatchDate(startDate)
          : '';

    return (
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.panelHeadText}>
            <div className={styles.panelTitleRow}>
              <h3 className={styles.panelTitle}>{round.label}</h3>
              {round.isKnockout && <span className={styles.stageChip}>{t('pages.matches.playoff')}</span>}
              {isMultiLeague && !!activeLeague && (
                <span className={styles.leagueChip}>
                  {t('pages.standings.league', undefined, { label: getLeagueLabel(activeLeague) })}
                </span>
              )}
            </div>
            {!!dateRange && (
              <p className={styles.panelMeta}>
                <CalendarIcon />
                {dateRange}
              </p>
            )}
          </div>

          <div className={styles.panelActions}>
            <div className={styles.chips}>
              {liveCount > 0 && (
                <span className={cn(styles.chip, styles.chipLive)}>
                  <span className={styles.liveDot} />
                  {t('pages.status.live')} {liveCount}
                </span>
              )}
              {finishedCount > 0 && (
                <span className={styles.chip}>
                  {t('pages.matches.chipCompleted', undefined, { count: finishedCount })}
                </span>
              )}
              {scheduledCount > 0 && (
                <span className={styles.chip}>
                  {t('pages.matches.chipScheduled', undefined, { count: scheduledCount })}
                </span>
              )}
            </div>

            <button
              type="button"
              className={cn(styles.livePill, { [styles.livePillActive]: onlyLiveMatches })}
              onClick={toggleLiveMatches}
              aria-pressed={onlyLiveMatches}>
              <span className={styles.liveDot} />
              {onlyLiveMatches ? t('pages.matches.onlyLive') : t('pages.matches.showLive')}
            </button>

            <button
              type="button"
              className={cn(styles.livePill, styles.scheduledPill, {
                [styles.scheduledPillActive]: onlyScheduledMatches,
              })}
              onClick={toggleScheduledMatches}
              aria-pressed={onlyScheduledMatches}>
              <span className={styles.scheduledDot} />
              {onlyScheduledMatches ? t('pages.matches.onlyScheduled') : t('pages.matches.showScheduled')}
            </button>
          </div>
        </div>

        {!!visibleMatches.length &&
          (isMultiLeague && !activeLeague ? renderLeagueBlocks(visibleMatches) : renderMatchesGrid(visibleMatches))}

        {!visibleMatches.length && (
          <div className={styles.emptyRound}>
            <span className={styles.emptyIcon}>
              <CalendarIcon />
            </span>
            <p className={styles.emptyTitle}>
              {onlyLiveMatches && !onlyScheduledMatches
                ? t('pages.matches.emptyRoundLive')
                : !onlyLiveMatches && onlyScheduledMatches
                  ? t('pages.matches.emptyRoundScheduled')
                  : isMultiLeague && !!activeLeague
                    ? t('pages.matches.emptyRoundLeague', undefined, {
                        league: t('pages.standings.league', undefined, { label: getLeagueLabel(activeLeague) }),
                      })
                    : t('pages.matches.emptyRound')}
            </p>
            <p className={styles.empty}>
              {onlyLiveMatches && !onlyScheduledMatches
                ? t('pages.matches.emptyRoundLiveText')
                : !onlyLiveMatches && onlyScheduledMatches
                  ? t('pages.matches.emptyRoundScheduledText')
                  : isMultiLeague && !!activeLeague
                    ? t('pages.matches.emptyRoundLeagueText')
                    : t('pages.matches.emptyRoundText')}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {renderHero()}

      {isMultiLeague && (
        <div className={styles.leagueFilter}>
          <button
            type="button"
            className={cn(styles.leagueTab, { [styles.leagueTabActive]: !activeLeague })}
            onClick={() => setActiveLeague(null)}>
            {t('pages.standings.allLeagues')}
          </button>
          {leagues.map((league, index) => (
            <button
              type="button"
              key={league}
              className={cn(styles.leagueTab, styles[LEAGUE_TONES[index % LEAGUE_TONES.length]], {
                [styles.leagueTabActive]: activeLeague === league,
              })}
              onClick={() => setActiveLeague(league)}>
              <span className={styles.leagueTabDot} />
              {t('pages.standings.league', undefined, { label: getLeagueLabel(league) })}
            </button>
          ))}
        </div>
      )}

      <Tabs className={styles.tabs} selectedIndex={activeTab} onSelect={handleTabChange}>
        <TabList className={styles.tabList}>
          {rounds.map((round) => {
            const roundMatches = filterByLeague(round.games?.data || []);
            const liveCount = countByStatus(roundMatches, MatchStatus.IN_PROGRESS);

            return (
              <Tab className={styles.tab} selectedClassName={styles.tabActive} key={round.key}>
                <span className={styles.tabLabel}>{round.label}</span>
                {liveCount > 0 ? (
                  <span className={styles.tabLive}>
                    <span className={styles.liveDot} />
                    {liveCount}
                  </span>
                ) : (
                  !!roundMatches.length && <span className={styles.tabCount}>{roundMatches.length}</span>
                )}
              </Tab>
            );
          })}
        </TabList>

        {rounds.map((round) => (
          <TabPanel className={styles.tabPanel} selectedClassName={styles.tabPanelActive} key={round.key}>
            {renderPanel(round)}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};

export default Matches;
