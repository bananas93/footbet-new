/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useAppDispatch, useAppSelector } from 'store';
import { normalizeKnockoutRoundName, normalizeMatchDate, sliceMatches } from 'helpers';
import { IGames, IMatch, MatchStatus } from 'interfaces';
import { toggleOnlyLiveMatches } from 'store/slices/user';
import { useTournament } from '../../Tournament';
import MatchCard from './MatchCard/MatchCard';
import styles from './Matches.module.scss';

type RoundTab = {
  key: string;
  label: string;
  isKnockout: boolean;
  games?: IGames;
};

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

const Matches: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tournament } = useTournament();

  const [activeTab, setActiveTab] = useState<number>(0);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  const { onlyLiveMatches } = useAppSelector((state) => state.user);
  const toggleLiveMatches = () => {
    dispatch(toggleOnlyLiveMatches());
  };

  const matches = useAppSelector((state) => state.match.matches)[tournament.id] || [];
  const { groupMatchNumber, knockoutRound, thirdPlaceMatch } = tournament;
  const knockoutRounds = normalizeKnockoutRoundName(knockoutRound, thirdPlaceMatch);

  const { groupMatches, knockoutMatches } = sliceMatches(matches, groupMatchNumber);

  const rounds = useMemo<RoundTab[]>(() => {
    const groupTabs = groupMatches.map((games, index) => ({
      key: `group-${index}`,
      label: `Тур ${index + 1}`,
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
  }, [matches, groupMatchNumber, knockoutRound, thirdPlaceMatch]);

  const overview = useMemo(() => {
    const allMatches = matches.flatMap((games) => games.data || []);
    return {
      rounds: rounds.length,
      total: allMatches.length,
      live: countByStatus(allMatches, MatchStatus.IN_PROGRESS),
      finished: countByStatus(allMatches, MatchStatus.FINISHED),
    };
  }, [matches, rounds.length]);

  useEffect(() => {
    setTimeout(() => {
      if (matches.length > 0) {
        const today = new Date().setHours(0, 0, 0, 0);
        const activeIndex = matches.findIndex((match, index) => {
          const matchStartDate = new Date(match.startDate).setHours(0, 0, 0, 0);
          const nextMatchStartDate =
            index < matches.length - 1
              ? new Date(matches[index + 1].startDate).setHours(0, 0, 0, 0)
              : new Date(match.endDate).setHours(0, 0, 0, 0);

          return today >= matchStartDate && today < nextMatchStartDate;
        });

        setActiveTab(activeIndex !== -1 ? activeIndex : 0);
      }
    }, 0);
  }, []);

  const renderHero = () => (
    <section className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.heroContent}>
        <div className={styles.heroText}>
          <span className={styles.heroEyebrow}>
            <BallIcon />
            Матчі турніру
          </span>
          <h2 className={styles.heroTitle}>{tournament.name}</h2>
          <p className={styles.heroSubtitle}>Календар турів, результати матчів та ваші прогнози</p>
        </div>

        {!!overview.total && (
          <div className={styles.heroMetrics}>
            <div className={styles.heroMetric}>
              <span className={styles.heroMetricValue}>{overview.rounds}</span>
              <span className={styles.heroMetricLabel}>Турів</span>
            </div>
            <div className={styles.heroMetric}>
              <span className={styles.heroMetricValue}>{overview.total}</span>
              <span className={styles.heroMetricLabel}>Матчів</span>
            </div>
            <div className={cn(styles.heroMetric, { [styles.heroMetricLive]: overview.live > 0 })}>
              <span className={styles.heroMetricValue}>{overview.live}</span>
              <span className={styles.heroMetricLabel}>Live</span>
            </div>
            <div className={styles.heroMetric}>
              <span className={styles.heroMetricValue}>{overview.finished}</span>
              <span className={styles.heroMetricLabel}>Завершено</span>
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
          <h3 className={styles.emptyTitle}>Матчів ще немає</h3>
          <p className={styles.empty}>Календар турніру з’явиться найближчим часом.</p>
        </section>
      </div>
    );
  }

  const renderPanel = (round: RoundTab) => {
    const roundMatches = round.games?.data || [];
    const liveCount = countByStatus(roundMatches, MatchStatus.IN_PROGRESS);
    const finishedCount = countByStatus(roundMatches, MatchStatus.FINISHED);
    const scheduledCount = countByStatus(roundMatches, MatchStatus.SCHEDULED);
    const visibleMatches = onlyLiveMatches
      ? roundMatches.filter((match) => match.status === MatchStatus.IN_PROGRESS)
      : roundMatches;

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
              {round.isKnockout && <span className={styles.stageChip}>Плей-оф</span>}
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
                  Live {liveCount}
                </span>
              )}
              {finishedCount > 0 && <span className={styles.chip}>Завершено {finishedCount}</span>}
              {scheduledCount > 0 && <span className={styles.chip}>Заплановано {scheduledCount}</span>}
            </div>

            <button
              type="button"
              className={cn(styles.livePill, { [styles.livePillActive]: onlyLiveMatches })}
              onClick={toggleLiveMatches}
              aria-pressed={onlyLiveMatches}>
              <span className={styles.liveDot} />
              {onlyLiveMatches ? 'Тільки Live' : 'Показати Live'}
            </button>
          </div>
        </div>

        {!!visibleMatches.length && (
          <div className={styles.matches}>
            {visibleMatches.map((match) => (
              <MatchCard key={match.id} match={match} tournament={tournament} />
            ))}
          </div>
        )}

        {!visibleMatches.length && (
          <div className={styles.emptyRound}>
            <span className={styles.emptyIcon}>
              <CalendarIcon />
            </span>
            <p className={styles.emptyTitle}>
              {onlyLiveMatches ? 'Немає матчів у прямому ефірі' : 'У цьому турі ще немає матчів'}
            </p>
            <p className={styles.empty}>
              {onlyLiveMatches
                ? 'Вимкніть фільтр Live, щоб побачити всі матчі туру.'
                : 'Розклад з’явиться найближчим часом.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {renderHero()}

      <Tabs className={styles.tabs} selectedIndex={activeTab} onSelect={handleTabChange}>
        <TabList className={styles.tabList}>
          {rounds.map((round) => {
            const roundMatches = round.games?.data || [];
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
          <TabPanel className={styles.tabPanel} key={round.key}>
            {renderPanel(round)}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};

export default Matches;
