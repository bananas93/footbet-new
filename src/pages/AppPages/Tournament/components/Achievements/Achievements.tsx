import { useMemo } from 'react';
import { Card } from 'components';
import { useAppSelector } from 'store';
import { getUserDisplayName } from 'helpers';
import { Link, useSearchParams } from 'react-router-dom';
import { useTournament } from '../../Tournament';
import styles from './Achievements.module.scss';

type Achievement = {
  title: string;
  description: string;
  value: string;
  winners: string;
};

type RankBadgeType = 'leader' | 'top3' | 'top10' | 'participant';

type RankBadge = {
  label: string;
  className: RankBadgeType;
};

const RankBadgeIcon: React.FC<{ type: RankBadgeType }> = ({ type }) => {
  if (type === 'leader') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.badgeIcon}>
        <path d="M5 6h14l-2 5a5 5 0 0 1-5 3 5 5 0 0 1-5-3L5 6Z" fill="currentColor" />
        <path d="M9 16h6v2H9zM8 20h8v2H8z" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'top3') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.badgeIcon}>
        <path d="M12 2l2.4 4.9L20 8l-4 3.9.9 5.6L12 15.1 7.1 17.5 8 11.9 4 8l5.6-.9L12 2Z" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'top10') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.badgeIcon}>
        <path d="M12 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" fill="currentColor" />
        <path d="M8.5 14.5 6 22l6-3 6 3-2.5-7.5" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.badgeIcon}>
      <circle cx="12" cy="12" r="8" fill="currentColor" />
      <circle cx="12" cy="12" r="3" fill="#fff" />
    </svg>
  );
};

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

const formatWinners = (names: string[]) => {
  if (!names.length) {
    return 'Немає даних';
  }

  if (names.length <= 2) {
    return names.join(', ');
  }

  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
};

const getRankedWinners = (
  namesWithValue: Array<{ name: string; value: number }>,
  minValue: number = Number.NEGATIVE_INFINITY,
) => {
  const eligible = namesWithValue.filter((item) => item.value > minValue);
  if (!eligible.length) {
    return { value: 0, names: [] as string[] };
  }

  const maxValue = Math.max(...eligible.map((item) => item.value));
  return {
    value: maxValue,
    names: eligible.filter((item) => item.value === maxValue).map((item) => item.name),
  };
};

const RankBadgeView: React.FC<{ rank: number }> = ({ rank }) => {
  const badge = getRankBadge(rank);
  return (
    <span className={`${styles.badge} ${styles[badge.className]}`}>
      <RankBadgeIcon type={badge.className} />
      <span>{badge.label}</span>
    </span>
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

    const points = getRankedWinners(table.map((item) => ({ name: item.name, value: item.points })));
    const exact = getRankedWinners(table.map((item) => ({ name: item.name, value: item.correctScore })));
    const outcomes = getRankedWinners(table.map((item) => ({ name: item.name, value: item.correctResult })));
    const differences = getRankedWinners(table.map((item) => ({ name: item.name, value: item.correctDifference })));
    const goals = getRankedWinners(table.map((item) => ({ name: item.name, value: item.fivePlusGoals })));
    const consistency = getRankedWinners(table.map((item) => ({ name: item.name, value: item.totalMatches })));

    const efficiency = getRankedWinners(
      table
        .filter((item) => item.totalMatches > 0)
        .map((item) => ({ name: item.name, value: item.points / item.totalMatches })),
      0,
    );

    return [
      {
        title: 'Лідер турніру',
        description: 'Максимум очок у загальній таблиці',
        value: `${points.value} очк.`,
        winners: formatWinners(points.names),
      },
      {
        title: 'Снайпер рахунку',
        description: 'Найбільше вгаданих точних рахунків',
        value: `${exact.value} точн.`,
        winners: formatWinners(exact.names),
      },
      {
        title: 'Майстер результатів',
        description: 'Найбільше вгаданих результатів',
        value: `${outcomes.value} рез.`,
        winners: formatWinners(outcomes.names),
      },
      {
        title: 'Експерт різниць',
        description: 'Найбільше вгаданих різниць мʼячів',
        value: `${differences.value} різн.`,
        winners: formatWinners(differences.names),
      },
      {
        title: 'Ризиковий аналітик',
        description: 'Найбільше матчів із 5+ голами',
        value: `${goals.value} матч.`,
        winners: formatWinners(goals.names),
      },
      {
        title: 'Стабільний гравець',
        description: 'Найбільше закритих матчів прогнозами',
        value: `${consistency.value} матч.`,
        winners: formatWinners(consistency.names),
      },
      {
        title: 'Ефективність туру',
        description: 'Найбільше очок у середньому за матч',
        value: `${efficiency.value.toFixed(2)} очк./матч`,
        winners: formatWinners(efficiency.names),
      },
    ];
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
      pointsGap: Math.max(0, leader.points - myRow.points),
      exactRank: rankByMetric((row) => row.correctScore),
      outcomeRank: rankByMetric((row) => row.correctResult),
      differenceRank: rankByMetric((row) => row.correctDifference),
      efficiencyRank: rankByMetric((row) => safeEfficiency(row)),
      efficiencyValue: safeEfficiency(myRow),
    } as const;
  }, [selectedUserId, table, user]);

  const isViewingAnotherUser = !!selectedUserId && selectedUserId !== user?.id;
  const userAchievementsLink = `/tournament/${tournament.id}/achievements`;

  return (
    <div className={styles.container}>
      <Card title={`Досягнення: ${tournament.name}`}>
        {!table.length && <p className={styles.empty}>Поки немає даних для підрахунку досягнень.</p>}

        {!!table.length && (
          <>
            <div className={styles.grid}>
              {achievements.map((achievement) => (
                <article className={styles.achievement} key={achievement.title}>
                  <h3 className={styles.achievementTitle}>{achievement.title}</h3>
                  <p className={styles.achievementDescription}>{achievement.description}</p>
                  <p className={styles.achievementValue}>{achievement.value}</p>
                </article>
              ))}
            </div>

            <div className={styles.myPanel}>
              <div className={styles.myTitleRow}>
                <h3 className={styles.myTitle}>
                  {isViewingAnotherUser ? 'Досягнення гравця' : 'Мої досягнення'}:{' '}
                  {mySummary && mySummary.found ? mySummary.userName : currentUserName}
                </h3>
                {isViewingAnotherUser && user && (
                  <Link to={userAchievementsLink} className={styles.myBackLink}>
                    Повернутись до моїх
                  </Link>
                )}
              </div>

              {!mySummary && (
                <p className={styles.empty}>Увійдіть у профіль або відкрийте досягнення користувача з таблиці.</p>
              )}

              {mySummary && !mySummary.found && mySummary.isMissingUser && (
                <p className={styles.empty}>Користувача не знайдено в таблиці турніру.</p>
              )}

              {mySummary && !mySummary.found && !mySummary.isMissingUser && (
                <p className={styles.empty}>
                  Поки вас немає в таблиці цього турніру. Зробіть кілька прогнозів, щоб потрапити в рейтинг.
                </p>
              )}

              {mySummary && mySummary.found && (
                <div className={styles.myStats}>
                  <div className={styles.myStat}>
                    <p className={styles.myLabel}>Місце</p>
                    <p className={styles.myValue}>
                      #{mySummary.place} з {mySummary.total}
                    </p>
                    <RankBadgeView rank={mySummary.place} />
                  </div>
                  <div className={styles.myStat}>
                    <p className={styles.myLabel}>Очки</p>
                    <p className={styles.myValue}>{mySummary.points}</p>
                    <p className={styles.myHint}>Від лідера: {mySummary.pointsGap}</p>
                  </div>
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
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Achievements;
