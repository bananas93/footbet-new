import { useMemo } from 'react';
import cn from 'classnames';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppSelector } from 'store';
import { getUserDisplayName, getUserInitials, resolveAssetUrl } from 'helpers';
import { useTournament } from '../../Tournament';
import styles from './Achievements.module.scss';
import { useI18n } from 'i18n';

type Tone = 'gold' | 'violet' | 'blue' | 'teal' | 'orange' | 'slate' | 'green';

type IconName = 'trophy' | 'target' | 'shield' | 'scales' | 'flame' | 'calendar' | 'bolt';

type Winner = {
  id: string;
  name: string;
  avatar?: string;
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

const getRankBadge = (
  rank: number,
  t: (key: string, fallback?: string, params?: Record<string, string | number>) => string,
) => {
  if (rank <= 1) {
    return { label: t('pages.achievements.badges.leader'), className: 'leader' } as RankBadge;
  }

  if (rank <= 3) {
    return { label: t('pages.achievements.badges.top3'), className: 'top3' } as RankBadge;
  }

  if (rank <= 10) {
    return { label: t('pages.achievements.badges.top10'), className: 'top10' } as RankBadge;
  }

  return { label: t('pages.achievements.badges.participant'), className: 'participant' } as RankBadge;
};

const getRankedWinners = (
  entries: Array<{ id: string; name: string; avatar?: string; value: number }>,
  minValue: number = 0,
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
      .map((item) => ({ id: item.id, name: item.name, avatar: item.avatar }) as Winner),
  };
};

const RankBadgeView: React.FC<{ rank: number }> = ({ rank }) => {
  const { t } = useI18n();
  const badge = getRankBadge(rank, t);
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
  const { t } = useI18n();
  if (!winners.length) {
    return <p className={styles.winnersEmpty}>{t('pages.achievements.noData')}</p>;
  }

  const visible = winners.slice(0, limit);
  const rest = winners.length - visible.length;

  return (
    <div className={styles.winners}>
      {visible.map((winner) => (
        <Link
          key={winner.id}
          to={`/profile/${winner.id}?tournamentId=${tournamentId}`}
          className={styles.winner}
          title={winner.name}>
          <span className={styles.winnerAvatar}>
            {winner.avatar ? (
              <img src={resolveAssetUrl(winner.avatar)} alt={winner.name} />
            ) : (
              getUserInitials(winner.name)
            )}
          </span>
          <span className={styles.winnerName}>{winner.name}</span>
        </Link>
      ))}
      {rest > 0 && <span className={styles.winnerMore}>+{rest}</span>}
    </div>
  );
};

const Achievements = () => {
  const { t } = useI18n();
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
      table.map((item) => ({ id: item.id, name: item.name, avatar: item.avatar, value: getter(item) }));

    const points = getRankedWinners(entries((item) => item.points));
    const exact = getRankedWinners(entries((item) => item.correctScore));
    const outcomes = getRankedWinners(entries((item) => item.correctResult));
    const differences = getRankedWinners(entries((item) => item.correctDifference));
    const goals = getRankedWinners(entries((item) => item.fivePlusGoals));
    const consistency = getRankedWinners(entries((item) => item.totalMatches));

    const efficiency = getRankedWinners(
      table
        .filter((item) => item.totalMatches > 0)
        .map((item) => ({ id: item.id, name: item.name, avatar: item.avatar, value: item.points / item.totalMatches })),
      0,
    );

    return [
      {
        key: 'points',
        title:
          tournament.status === 'completed'
            ? t('pages.achievements.cards.points.titleCompleted')
            : t('pages.achievements.cards.points.title'),
        description: t('pages.achievements.cards.points.description'),
        value: `${points.value}`,
        unit: t('pages.achievements.cards.points.unit'),
        tone: 'gold',
        icon: 'trophy',
        winners: points.winners,
      },
      {
        key: 'exact',
        title: t('pages.achievements.cards.exact.title'),
        description: t('pages.achievements.cards.exact.description'),
        value: `${exact.value}`,
        unit: t('pages.achievements.cards.exact.unit'),
        tone: 'violet',
        icon: 'target',
        winners: exact.winners,
      },
      {
        key: 'outcomes',
        title: t('pages.achievements.cards.outcomes.title'),
        description: t('pages.achievements.cards.outcomes.description'),
        value: `${outcomes.value}`,
        unit: t('pages.achievements.cards.outcomes.unit'),
        tone: 'blue',
        icon: 'shield',
        winners: outcomes.winners,
      },
      {
        key: 'differences',
        title: t('pages.achievements.cards.differences.title'),
        description: t('pages.achievements.cards.differences.description'),
        value: `${differences.value}`,
        unit: t('pages.achievements.cards.differences.unit'),
        tone: 'teal',
        icon: 'scales',
        winners: differences.winners,
      },
      {
        key: 'goals',
        title: t('pages.achievements.cards.goals.title'),
        description: t('pages.achievements.cards.goals.description'),
        value: `${goals.value}`,
        unit: t('pages.achievements.cards.goals.unit'),
        tone: 'orange',
        icon: 'flame',
        winners: goals.winners,
      },
      {
        key: 'consistency',
        title: t('pages.achievements.cards.consistency.title'),
        description: t('pages.achievements.cards.consistency.description'),
        value: `${consistency.value}`,
        unit: t('pages.achievements.cards.consistency.unit'),
        tone: 'slate',
        icon: 'calendar',
        winners: consistency.winners,
      },
      {
        key: 'efficiency',
        title: t('pages.achievements.cards.efficiency.title'),
        description: t('pages.achievements.cards.efficiency.description'),
        value: efficiency.value.toFixed(2),
        unit: t('pages.achievements.cards.efficiency.unit'),
        tone: 'green',
        icon: 'bolt',
        winners: efficiency.winners,
      },
    ];
  }, [t, table, tournament.status]);

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

    const rankByMetric = (getter: (row: (typeof table)[number]) => number): number | null => {
      const maxValue = Math.max(...table.map((row) => getter(row)));
      if (maxValue <= 0) {
        return null;
      }

      const myValue = getter(myRow);
      const higher = table.filter((row) => getter(row) > myValue).length;
      return higher + 1;
    };

    const safeEfficiency = (row: (typeof table)[number]) => (row.totalMatches > 0 ? row.points / row.totalMatches : 0);

    return {
      found: true,
      isMissingUser: false,
      userName: myRow.name,
      userAvatar: myRow.avatar,
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
  const panelAvatar = mySummary && mySummary.found ? mySummary.userAvatar : user?.avatar;

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <span className={styles.heroEyebrow}>
              <AchievementIcon name="trophy" className={styles.heroEyebrowIcon} />
              {t('pages.achievements.title')}
            </span>
            <h2 className={styles.heroTitle}>{tournament.name}</h2>
            <p className={styles.heroSubtitle}>{t('pages.achievements.subtitle')}</p>
          </div>

          {!!table.length && (
            <div className={styles.heroMetrics}>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.players}</span>
                <span className={styles.heroMetricLabel}>{t('pages.achievements.metrics.players')}</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.predicts}</span>
                <span className={styles.heroMetricLabel}>{t('pages.achievements.metrics.predictions')}</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.exactScores}</span>
                <span className={styles.heroMetricLabel}>{t('pages.achievements.metrics.exactScores')}</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{achievements.length}</span>
                <span className={styles.heroMetricLabel}>{t('pages.achievements.metrics.awards')}</span>
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
          <h3 className={styles.emptyTitle}>{t('pages.achievements.emptyTitle')}</h3>
          <p className={styles.empty}>{t('pages.achievements.emptyText')}</p>
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
                  <span className={styles.spotlightTag}>{t('pages.achievements.mainAward')}</span>
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
                    ? t('pages.achievements.spotlight.firstContender')
                    : overview.leaderGap > 0
                      ? t('pages.achievements.spotlight.leaderGap', undefined, { gap: overview.leaderGap })
                      : t('pages.achievements.spotlight.tightRace')}
                </p>
              </div>
            </section>
          )}

          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>{t('pages.achievements.categoriesTitle')}</h3>
            <span className={styles.sectionMeta}>
              {t('pages.achievements.categoriesCount', undefined, { count: restAchievements.length })}
            </span>
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
                <span className={styles.myAvatar}>
                  {panelAvatar ? (
                    <img src={resolveAssetUrl(panelAvatar)} alt={panelName} />
                  ) : (
                    getUserInitials(panelName)
                  )}
                </span>
                <div>
                  <span className={styles.myEyebrow}>
                    {isViewingAnotherUser
                      ? t('pages.achievements.playerAchievements')
                      : t('pages.achievements.myAchievements')}
                  </span>
                  <h3 className={styles.myTitle}>{panelName}</h3>
                </div>
              </div>
              {isViewingAnotherUser && user && (
                <Link to={userAchievementsLink} className={styles.myBackLink}>
                  {t('pages.achievements.backToMine')}
                </Link>
              )}
            </div>

            {!mySummary && <p className={styles.myEmpty}>{t('pages.achievements.myEmpty')}</p>}

            {mySummary && !mySummary.found && mySummary.isMissingUser && (
              <p className={styles.myEmpty}>{t('pages.achievements.userNotFound')}</p>
            )}

            {mySummary && !mySummary.found && !mySummary.isMissingUser && (
              <p className={styles.myEmpty}>{t('pages.achievements.notInTableYet')}</p>
            )}

            {mySummary && mySummary.found && (
              <>
                <div className={styles.myOverview}>
                  <div className={styles.myRank}>
                    <div className={styles.myRankRing} style={{ '--progress': rankPercent } as React.CSSProperties}>
                      <div className={styles.myRankRingInner}>
                        <span className={styles.myRankPlace}>#{mySummary.place}</span>
                        <span className={styles.myRankTotal}>
                          {t('pages.achievements.ofTotal', undefined, { total: mySummary.total })}
                        </span>
                      </div>
                    </div>
                    <div className={styles.myRankInfo}>
                      <RankBadgeView rank={mySummary.place} />
                      <p className={styles.myRankHint}>
                        {t('pages.achievements.rankHint', undefined, { percent: rankPercent })}
                      </p>
                    </div>
                  </div>

                  <div className={styles.myProgress}>
                    <div className={styles.myProgressHead}>
                      <span className={styles.myProgressLabel}>{t('pages.achievements.points')}</span>
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
                        {mySummary.pointsGap > 0
                          ? t('pages.achievements.gapFromLeader', undefined, { points: mySummary.pointsGap })
                          : t('pages.achievements.youAreLeader')}
                      </span>
                      <span>{t('pages.achievements.matchesCount', undefined, { count: mySummary.totalMatches })}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.myStats}>
                  <div className={styles.myStat}>
                    <p className={styles.myLabel}>{t('pages.achievements.stats.exactScores')}</p>
                    <p className={styles.myValue}>{mySummary.exactRank ? `#${mySummary.exactRank}` : '—'}</p>
                    {mySummary.exactRank && <RankBadgeView rank={mySummary.exactRank} />}
                  </div>
                  <div className={styles.myStat}>
                    <p className={styles.myLabel}>{t('pages.achievements.stats.results')}</p>
                    <p className={styles.myValue}>{mySummary.outcomeRank ? `#${mySummary.outcomeRank}` : '—'}</p>
                    {mySummary.outcomeRank && <RankBadgeView rank={mySummary.outcomeRank} />}
                  </div>
                  <div className={styles.myStat}>
                    <p className={styles.myLabel}>{t('pages.achievements.stats.differences')}</p>
                    <p className={styles.myValue}>{mySummary.differenceRank ? `#${mySummary.differenceRank}` : '—'}</p>
                    {mySummary.differenceRank && <RankBadgeView rank={mySummary.differenceRank} />}
                  </div>
                  <div className={styles.myStat}>
                    <p className={styles.myLabel}>{t('pages.achievements.stats.efficiency')}</p>
                    <p className={styles.myValue}>{mySummary.efficiencyRank ? `#${mySummary.efficiencyRank}` : '—'}</p>
                    <p className={styles.myHint}>
                      {t('pages.achievements.efficiencyValue', undefined, {
                        value: mySummary.efficiencyValue.toFixed(2),
                      })}
                    </p>
                    {mySummary.efficiencyRank && <RankBadgeView rank={mySummary.efficiencyRank} />}
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
