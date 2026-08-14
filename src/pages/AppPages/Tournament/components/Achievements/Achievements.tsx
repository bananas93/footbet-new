import { useMemo } from 'react';
import cn from 'classnames';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppSelector } from 'store';
import { getUserDisplayName, getUserInitials } from 'helpers';
import { useTournament } from '../../Tournament';
import styles from './Achievements.module.scss';

type Tone = 'gold' | 'violet' | 'blue' | 'teal' | 'orange' | 'slate' | 'green';

type IconName = 'trophy' | 'target' | 'shield' | 'scales' | 'flame' | 'calendar' | 'bolt';

type Winner = {
  id: string;
  name: string;
};

type Achievement = {
  key: string;
  title: string;
  description: string;
  value: string;
  unit: string;
  tone: Tone;
  icon: IconName;
  winners: Winner[];
};

type RankBadgeType = 'leader' | 'top3' | 'top10' | 'participant';

type RankBadge = {
  label: string;
  className: RankBadgeType;
};

const iconPaths: Record<IconName, React.ReactNode> = {
  trophy: (
    <>
      <path d="M8 4h8v5.2a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5.5H5.6A1.6 1.6 0 0 0 4 7.1v.6a3.8 3.8 0 0 0 3.8 3.8H8" />
      <path d="M16 5.5h2.4A1.6 1.6 0 0 1 20 7.1v.6a3.8 3.8 0 0 1-3.8 3.8H16" />
      <path d="M12 13.2V16" />
      <path d="M9.6 20h4.8l-.6-3h-3.6L9.6 20Z" />
      <path d="M8.4 20h7.2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.2l7 2.8v5.4c0 4.1-2.9 7.4-7 8.6-4.1-1.2-7-4.5-7-8.6V6l7-2.8Z" />
      <path d="M9 12.1l2.2 2.2 4-4.3" />
    </>
  ),
  scales: (
    <>
      <path d="M12 4.5V20" />
      <path d="M5 8.2h14" />
      <path d="M5 8.2 2.6 13.4h4.8L5 8.2Z" />
      <path d="M19 8.2l-2.4 5.2h4.8L19 8.2Z" />
      <path d="M9 20h6" />
    </>
  ),
  flame: (
    <>
      <path d="M13.4 3c.6 3-1.3 4.3-2.7 5.7C9.1 10.2 7 11.7 7 14.2A5 5 0 0 0 17 14.2c0-1.9-.8-3.2-1.8-4.5" />
      <path d="M12 20a2.6 2.6 0 0 1-2.6-2.6c0-1.7 2.6-3.7 2.6-3.7s2.6 2 2.6 3.7A2.6 2.6 0 0 1 12 20Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.4" y="5.2" width="17.2" height="15" rx="2.6" />
      <path d="M8 3.2v4M16 3.2v4M3.4 10h17.2" />
      <path d="M7.8 13.6h2.2M14 13.6h2.2M7.8 16.8h2.2M14 16.8h2.2" />
    </>
  ),
  bolt: (
    <>
      <path d="M13.4 3 6.4 13.2h4.6L9.8 21l7.4-10.6h-4.7l.9-7.4Z" />
    </>
  ),
};

const AchievementIcon: React.FC<{ name: IconName; className?: string }> = ({ name, className }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn(styles.icon, className)}
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round">
    {iconPaths[name]}
  </svg>
);

const badgePaths: Record<RankBadgeType, React.ReactNode> = {
  leader: <path d="M4 7.5l3.4 2.6L12 4l4.6 6.1L20 7.5 18.4 18H5.6L4 7.5Z" />,
  top3: <path d="M12 3.6l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8 2.5-5Z" />,
  top10: (
    <>
      <circle cx="12" cy="9.5" r="5" />
      <path d="M8.6 13.8 6.8 20.5l5.2-2.4 5.2 2.4-1.8-6.7" />
    </>
  ),
  participant: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.4" />
    </>
  ),
};

const RankBadgeIcon: React.FC<{ type: RankBadgeType }> = ({ type }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.badgeIcon}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round">
    {badgePaths[type]}
  </svg>
);

const getRankBadge = (rank: number) => {
  if (rank <= 1) {
    return { label: 'Лідер', className: 'leader' } as RankBadge;
  }

  if (rank <= 3) {
    return { label: 'Топ-3', className: 'top3' } as RankBadge;
  }

  if (rank <= 10) {
    return { label: 'Топ-10', className: 'top10' } as RankBadge;
  }

  return { label: 'У грі', className: 'participant' } as RankBadge;
};

const getRankedWinners = (
  entries: Array<{ id: string; name: string; value: number }>,
  minValue: number = Number.NEGATIVE_INFINITY,
) => {
  const eligible = entries.filter((item) => item.value > minValue);
  if (!eligible.length) {
    return { value: 0, winners: [] as Winner[] };
  }

  const maxValue = Math.max(...eligible.map((item) => item.value));
  return {
    value: maxValue,
    winners: eligible
      .filter((item) => item.value === maxValue)
      .map((item) => ({ id: item.id, name: item.name }) as Winner),
  };
};

const RankBadgeView: React.FC<{ rank: number }> = ({ rank }) => {
  const badge = getRankBadge(rank);
  return (
    <span className={cn(styles.badge, styles[badge.className])}>
      <RankBadgeIcon type={badge.className} />
      <span>{badge.label}</span>
    </span>
  );
};

const WinnersRow: React.FC<{ winners: Winner[]; tournamentId: number; limit?: number }> = ({
  winners,
  tournamentId,
  limit = 3,
}) => {
  if (!winners.length) {
    return <p className={styles.winnersEmpty}>Немає даних</p>;
  }

  const visible = winners.slice(0, limit);
  const rest = winners.length - visible.length;

  return (
    <div className={styles.winners}>
      {visible.map((winner) => (
        <Link
          key={winner.id}
          to={`/tournament/${tournamentId}/achievements?userId=${winner.id}`}
          className={styles.winner}
          title={winner.name}>
          <span className={styles.winnerAvatar}>{getUserInitials(winner.name)}</span>
          <span className={styles.winnerName}>{winner.name}</span>
        </Link>
      ))}
      {rest > 0 && <span className={styles.winnerMore}>+{rest}</span>}
    </div>
  );
};

const Achievements = () => {
  const { tournament } = useTournament();
  const [searchParams] = useSearchParams();
  const user = useAppSelector((state) => state.user.user);
  const table = useAppSelector((state) => state.predict.table[tournament.id] || []);
  const currentUserName = getUserDisplayName(user?.name, user?.nickname);
  const selectedUserId = searchParams.get('userId')?.trim() || '';

  const achievements = useMemo<Achievement[]>(() => {
    if (!table.length) {
      return [];
    }

    const entries = (getter: (row: (typeof table)[number]) => number) =>
      table.map((item) => ({ id: item.id, name: item.name, value: getter(item) }));

    const points = getRankedWinners(entries((item) => item.points));
    const exact = getRankedWinners(entries((item) => item.correctScore));
    const outcomes = getRankedWinners(entries((item) => item.correctResult));
    const differences = getRankedWinners(entries((item) => item.correctDifference));
    const goals = getRankedWinners(entries((item) => item.fivePlusGoals));
    const consistency = getRankedWinners(entries((item) => item.totalMatches));

    const efficiency = getRankedWinners(
      table
        .filter((item) => item.totalMatches > 0)
        .map((item) => ({ id: item.id, name: item.name, value: item.points / item.totalMatches })),
      0,
    );

    return [
      {
        key: 'points',
        title: 'Лідер турніру',
        description: 'Максимум очок у загальній таблиці',
        value: `${points.value}`,
        unit: 'очк.',
        tone: 'gold',
        icon: 'trophy',
        winners: points.winners,
      },
      {
        key: 'exact',
        title: 'Снайпер рахунку',
        description: 'Найбільше вгаданих точних рахунків',
        value: `${exact.value}`,
        unit: 'точн.',
        tone: 'violet',
        icon: 'target',
        winners: exact.winners,
      },
      {
        key: 'outcomes',
        title: 'Майстер результатів',
        description: 'Найбільше вгаданих результатів',
        value: `${outcomes.value}`,
        unit: 'рез.',
        tone: 'blue',
        icon: 'shield',
        winners: outcomes.winners,
      },
      {
        key: 'differences',
        title: 'Експерт різниць',
        description: 'Найбільше вгаданих різниць мʼячів',
        value: `${differences.value}`,
        unit: 'різн.',
        tone: 'teal',
        icon: 'scales',
        winners: differences.winners,
      },
      {
        key: 'goals',
        title: 'Ризиковий аналітик',
        description: 'Найбільше матчів із 5+ голами',
        value: `${goals.value}`,
        unit: 'матч.',
        tone: 'orange',
        icon: 'flame',
        winners: goals.winners,
      },
      {
        key: 'consistency',
        title: 'Стабільний гравець',
        description: 'Найбільше закритих матчів прогнозами',
        value: `${consistency.value}`,
        unit: 'матч.',
        tone: 'slate',
        icon: 'calendar',
        winners: consistency.winners,
      },
      {
        key: 'efficiency',
        title: 'Ефективність туру',
        description: 'Найбільше очок у середньому за матч',
        value: efficiency.value.toFixed(2),
        unit: 'очк./матч',
        tone: 'green',
        icon: 'bolt',
        winners: efficiency.winners,
      },
    ];
  }, [table]);

  const overview = useMemo(() => {
    return {
      players: table.length,
      predicts: table.reduce((acc, item) => acc + item.totalMatches, 0),
      exactScores: table.reduce((acc, item) => acc + item.correctScore, 0),
      leaderGap: table.length > 1 ? table[0].points - table[1].points : 0,
    };
  }, [table]);

  const mySummary = useMemo(() => {
    if (!table.length) {
      return null;
    }

    const selectedUserRow = selectedUserId ? table.find((item) => item.id === selectedUserId) : null;
    const currentUserRow = user ? table.find((item) => item.id === user.id) : null;
    const targetUserRow = selectedUserRow || currentUserRow;

    if (!targetUserRow) {
      if (selectedUserId) {
        return {
          found: false,
          isMissingUser: true,
        } as const;
      }

      return null;
    }

    const myIndex = table.findIndex((item) => item.id === targetUserRow.id);
    if (myIndex === -1) {
      return {
        found: false,
        isMissingUser: false,
      } as const;
    }

    const myRow = targetUserRow;
    const leader = table[0];

    const rankByMetric = (getter: (row: (typeof table)[number]) => number) => {
      const myValue = getter(myRow);
      const higher = table.filter((row) => getter(row) > myValue).length;
      return higher + 1;
    };

    const safeEfficiency = (row: (typeof table)[number]) => (row.totalMatches > 0 ? row.points / row.totalMatches : 0);

    return {
      found: true,
      isMissingUser: false,
      userName: myRow.name,
      place: myIndex + 1,
      total: table.length,
      points: myRow.points,
      leaderPoints: leader.points,
      pointsGap: Math.max(0, leader.points - myRow.points),
      totalMatches: myRow.totalMatches,
      exactRank: rankByMetric((row) => row.correctScore),
      outcomeRank: rankByMetric((row) => row.correctResult),
      differenceRank: rankByMetric((row) => row.correctDifference),
      efficiencyRank: rankByMetric((row) => safeEfficiency(row)),
      efficiencyValue: safeEfficiency(myRow),
    } as const;
  }, [selectedUserId, table, user]);

  const isViewingAnotherUser = !!selectedUserId && selectedUserId !== user?.id;
  const userAchievementsLink = `/tournament/${tournament.id}/achievements`;

  const spotlight = achievements[0];
  const restAchievements = achievements.slice(1);

  const rankPercent =
    mySummary && mySummary.found
      ? mySummary.total > 1
        ? Math.round(((mySummary.total - mySummary.place) / (mySummary.total - 1)) * 100)
        : 100
      : 0;

  const pointsPercent =
    mySummary && mySummary.found && mySummary.leaderPoints > 0
      ? Math.min(100, Math.round((mySummary.points / mySummary.leaderPoints) * 100))
      : 0;

  const panelName = mySummary && mySummary.found ? mySummary.userName : currentUserName;

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <span className={styles.heroEyebrow}>
              <AchievementIcon name="trophy" className={styles.heroEyebrowIcon} />
              Зала досягнень
            </span>
            <h2 className={styles.heroTitle}>{tournament.name}</h2>
            <p className={styles.heroSubtitle}>Рекорди турніру, персональні нагороди та боротьба за перше місце</p>
          </div>

          {!!table.length && (
            <div className={styles.heroMetrics}>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.players}</span>
                <span className={styles.heroMetricLabel}>Гравців</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.predicts}</span>
                <span className={styles.heroMetricLabel}>Прогнозів</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.exactScores}</span>
                <span className={styles.heroMetricLabel}>Точних рахунків</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{achievements.length}</span>
                <span className={styles.heroMetricLabel}>Нагород</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {!table.length && (
        <section className={styles.emptyCard}>
          <span className={styles.emptyIcon}>
            <AchievementIcon name="trophy" />
          </span>
          <h3 className={styles.emptyTitle}>Нагороди ще не розіграні</h3>
          <p className={styles.empty}>Поки немає даних для підрахунку досягнень.</p>
        </section>
      )}

      {!!table.length && (
        <>
          {spotlight && (
            <section className={cn(styles.spotlight, styles[spotlight.tone])}>
              <div className={styles.spotlightGlow} aria-hidden="true" />
              <div className={styles.spotlightMain}>
                <span className={styles.spotlightIcon}>
                  <AchievementIcon name={spotlight.icon} />
                </span>
                <div>
                  <span className={styles.spotlightTag}>Головна нагорода</span>
                  <h3 className={styles.spotlightTitle}>{spotlight.title}</h3>
                  <p className={styles.spotlightDescription}>{spotlight.description}</p>
                  <WinnersRow winners={spotlight.winners} tournamentId={tournament.id} limit={4} />
                </div>
              </div>
              <div className={styles.spotlightAside}>
                <p className={styles.spotlightValue}>
                  {spotlight.value}
                  <span className={styles.spotlightUnit}>{spotlight.unit}</span>
                </p>
                <p className={styles.spotlightHint}>
                  {overview.players < 2
                    ? 'Перший претендент на трофей'
                    : overview.leaderGap > 0
                      ? `Відрив від 2-го місця: ${overview.leaderGap} очк.`
                      : 'Рівна боротьба за перше місце'}
                </p>
              </div>
            </section>
          )}

          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Номінації турніру</h3>
            <span className={styles.sectionMeta}>{restAchievements.length} категорій</span>
          </div>

          <div className={styles.grid}>
            {restAchievements.map((achievement, index) => (
              <article
                className={cn(styles.achievement, styles[achievement.tone])}
                key={achievement.key}
                style={{ '--i': index } as React.CSSProperties}>
                <div className={styles.achievementTop}>
                  <span className={styles.achievementIcon}>
                    <AchievementIcon name={achievement.icon} />
                  </span>
                  <p className={styles.achievementValue}>
                    {achievement.value}
                    <span className={styles.achievementUnit}>{achievement.unit}</span>
                  </p>
                </div>
                <h4 className={styles.achievementTitle}>{achievement.title}</h4>
                <p className={styles.achievementDescription}>{achievement.description}</p>
                <div className={styles.achievementFooter}>
                  <WinnersRow winners={achievement.winners} tournamentId={tournament.id} />
                </div>
              </article>
            ))}
          </div>

          <section className={styles.myPanel}>
            <div className={styles.myPanelGlow} aria-hidden="true" />

            <div className={styles.myTitleRow}>
              <div className={styles.myIdentity}>
                <span className={styles.myAvatar}>{getUserInitials(panelName)}</span>
                <div>
                  <span className={styles.myEyebrow}>
                    {isViewingAnotherUser ? 'Досягнення гравця' : 'Мої досягнення'}
                  </span>
                  <h3 className={styles.myTitle}>{panelName}</h3>
                </div>
              </div>
              {isViewingAnotherUser && user && (
                <Link to={userAchievementsLink} className={styles.myBackLink}>
                  Повернутись до моїх
                </Link>
              )}
            </div>

            {!mySummary && (
              <p className={styles.myEmpty}>Увійдіть у профіль або відкрийте досягнення користувача з таблиці.</p>
            )}

            {mySummary && !mySummary.found && mySummary.isMissingUser && (
              <p className={styles.myEmpty}>Користувача не знайдено в таблиці турніру.</p>
            )}

            {mySummary && !mySummary.found && !mySummary.isMissingUser && (
              <p className={styles.myEmpty}>
                Поки вас немає в таблиці цього турніру. Зробіть кілька прогнозів, щоб потрапити в рейтинг.
              </p>
            )}

            {mySummary && mySummary.found && (
              <>
                <div className={styles.myOverview}>
                  <div className={styles.myRank}>
                    <div className={styles.myRankRing} style={{ '--progress': rankPercent } as React.CSSProperties}>
                      <div className={styles.myRankRingInner}>
                        <span className={styles.myRankPlace}>#{mySummary.place}</span>
                        <span className={styles.myRankTotal}>з {mySummary.total}</span>
                      </div>
                    </div>
                    <div className={styles.myRankInfo}>
                      <RankBadgeView rank={mySummary.place} />
                      <p className={styles.myRankHint}>
                        Ви кращі за {rankPercent}% учасників турніру за сумою очок.
                      </p>
                    </div>
                  </div>

                  <div className={styles.myProgress}>
                    <div className={styles.myProgressHead}>
                      <span className={styles.myProgressLabel}>Очки</span>
                      <span className={styles.myProgressValue}>
                        {mySummary.points}
                        <span className={styles.myProgressOf}>/ {mySummary.leaderPoints}</span>
                      </span>
                    </div>
                    <div className={styles.myProgressTrack}>
                      <span
                        className={styles.myProgressFill}
                        style={{ width: `${pointsPercent}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className={styles.myProgressFoot}>
                      <span>
                        {mySummary.pointsGap > 0 ? `Від лідера: ${mySummary.pointsGap} очк.` : 'Ви очолюєте турнір'}
                      </span>
                      <span>{mySummary.totalMatches} матч.</span>
                    </div>
                  </div>
                </div>

                <div className={styles.myStats}>
                  <div className={styles.myStat}>
                    <p className={styles.myLabel}>Точні рахунки</p>
                    <p className={styles.myValue}>#{mySummary.exactRank}</p>
                    <RankBadgeView rank={mySummary.exactRank} />
                  </div>
                  <div className={styles.myStat}>
                    <p className={styles.myLabel}>Результати</p>
                    <p className={styles.myValue}>#{mySummary.outcomeRank}</p>
                    <RankBadgeView rank={mySummary.outcomeRank} />
                  </div>
                  <div className={styles.myStat}>
                    <p className={styles.myLabel}>Різниці</p>
                    <p className={styles.myValue}>#{mySummary.differenceRank}</p>
                    <RankBadgeView rank={mySummary.differenceRank} />
                  </div>
                  <div className={styles.myStat}>
                    <p className={styles.myLabel}>Ефективність</p>
                    <p className={styles.myValue}>#{mySummary.efficiencyRank}</p>
                    <p className={styles.myHint}>{mySummary.efficiencyValue.toFixed(2)} очк./матч</p>
                    <RankBadgeView rank={mySummary.efficiencyRank} />
                  </div>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Achievements;
