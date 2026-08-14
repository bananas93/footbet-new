import { useEffect, useMemo } from 'react';
import cn from 'classnames';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'store';
import { getProfile } from 'store/slices/profile';
import { getUserDisplayName, getUserInitials, resolveAssetUrl } from 'helpers';
import styles from './Profile.module.scss';

const iconProps = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const UserIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 19.5c.9-3.4 3.7-5.2 7.2-5.2s6.3 1.8 7.2 5.2" />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M15 5.5 8.5 12l6.5 6.5" />
  </svg>
);

const TargetIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const FlameIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M12 3.5c2.6 2.6 4.6 4.9 4.6 7.6a4.6 4.6 0 0 1-9.2 0c0-1.1.4-2.1 1.1-3.1.7 1 1.4 1.5 2.1 1.5.9 0 1.4-.8 1.4-2.2 0-1.2-.3-2.5-1-3.8Z" />
    <path d="M8.4 15.6c0 2.6 1.6 4.9 3.6 4.9s3.6-2.3 3.6-4.9" />
  </svg>
);

const ChartIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M4.5 19.5h15" />
    <path d="M7.5 19.5v-6M12 19.5V6.5M16.5 19.5v-9" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="m12 4.5 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 10.2l5.4-.8L12 4.5Z" />
  </svg>
);

const BallIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2l2.8 2-1 3.3h-3.6l-1-3.3 2.8-2Z" />
    <path d="M12 3.5v3.7M6.1 9.4l4.1 2.9M17.9 9.4l-4.1 2.9M9.3 15.4 7.6 19M14.7 15.4 16.4 19" />
  </svg>
);

const EmptyIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="M8 10.5h8M8 14h5" />
  </svg>
);

type Tone = 'gold' | 'teal' | 'blue' | 'orange';

const PREDICTION_LABELS: Record<string, string> = {
  home: 'Перемога господарів',
  away: 'Перемога гостей',
  draw: 'Нічия',
};

const toPercent = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

const isScore = (value?: string | null) => !!value && /^\d+\s*-\s*\d+$/.test(value.trim());

const ProfileSkeleton = () => (
  <div className={styles.page}>
    <span className={cn(styles.skeletonBlock, styles.skeletonHero)} />
    <div className={styles.skeletonGrid}>
      {Array.from({ length: 4 }, (_, index) => (
        <span className={styles.skeletonBlock} key={index} />
      ))}
    </div>
    <span className={cn(styles.skeletonBlock, styles.skeletonPanel)} />
  </div>
);

const ProfileMessage = ({ title, text }: { title: string; text: string }) => (
  <div className={styles.page}>
    <div className={styles.emptyCard}>
      <span className={styles.emptyIcon}>
        <EmptyIcon />
      </span>
      <h2 className={styles.emptyTitle}>{title}</h2>
      <p className={styles.emptyText}>{text}</p>
    </div>
  </div>
);

const Profile = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, isLoading } = useAppSelector((state) => state.profile.getProfileRequest);
  const { userId, tournamentId } = useParams<{ userId: string; tournamentId: string }>();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await dispatch(getProfile({ userId: Number(userId), tournamentId: Number(tournamentId) })).unwrap();
      } catch (err: any) {
        console.error(err.message);
      }
    };

    fetchUser();
  }, [dispatch, tournamentId, userId]);

  const profileDisplayName = getUserDisplayName(data?.user?.name, data?.user?.nickname);

  useEffect(() => {
    if (data?.user) {
      document.title = `${profileDisplayName} | Footbet`;
    }

    return () => {
      document.title = 'Турнір прогнозистів | Footbet';
    };
  }, [data?.user, profileDisplayName]);

  const statistics = data?.statistics;

  const accuracyCards = useMemo(() => {
    if (!statistics) {
      return [];
    }

    const total = statistics.total || 0;

    return [
      {
        key: 'score',
        tone: 'gold' as Tone,
        label: 'Ідеальний прогноз',
        title: 'Точний рахунок',
        value: statistics.correctScore || 0,
        percent: toPercent(statistics.correctScore || 0, total),
      },
      {
        key: 'result',
        tone: 'teal' as Tone,
        label: 'Базовий результат',
        title: 'Вгаданий переможець',
        value: statistics.correctResult || 0,
        percent: toPercent(statistics.correctResult || 0, total),
      },
      {
        key: 'difference',
        tone: 'blue' as Tone,
        label: 'Точна різниця',
        title: 'Вгадана різниця мʼячів',
        value: statistics.correctDifference || 0,
        percent: toPercent(statistics.correctDifference || 0, total),
      },
      {
        key: 'fivePlus',
        tone: 'orange' as Tone,
        label: 'Максимум за матч',
        title: 'Точний рахунок у матчі 5+ голів',
        value: statistics.fivePlusGoals || 0,
        percent: toPercent(statistics.fivePlusGoals || 0, total),
      },
    ];
  }, [statistics]);

  const streaks = useMemo(() => {
    if (!statistics) {
      return [];
    }

    return [
      {
        key: 'scoreRow',
        tone: 'gold' as Tone,
        title: 'Точні рахунки поспіль',
        meta: 'Найдовша серія',
        value: statistics.correctScorePerRow || 0,
      },
      {
        key: 'resultRow',
        tone: 'teal' as Tone,
        title: 'Вгадані результати поспіль',
        meta: 'Найдовша серія',
        value: statistics.correctResultPerRow || 0,
      },
      {
        key: 'losing',
        tone: 'orange' as Tone,
        title: 'Матчі без очок поспіль',
        meta: 'Найгірша серія',
        value: statistics.longestLosingStreak || 0,
      },
    ];
  }, [statistics]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!userId) {
    return <ProfileMessage title="Некоректне посилання" text="Не вдалося визначити гравця. Спробуйте ще раз." />;
  }

  if (!data || !statistics) {
    return <ProfileMessage title="Дані не знайдено" text="Профіль цього гравця недоступний у поточному турнірі." />;
  }

  const total = statistics.total || 0;
  const hasPredictions = total > 0;

  const avatarUrl = resolveAssetUrl(data.user?.avatar);
  const initials = getUserInitials(data.user?.name, data.user?.nickname);

  const correctHome = statistics.correctHomePredictions || 0;
  const correctAway = statistics.correctAwayPredictions || 0;
  const sidesTotal = correctHome + correctAway;
  const homeShare = sidesTotal > 0 ? Math.round((correctHome / sidesTotal) * 100) : 50;

  const favoriteTeams = statistics.topFiveFavoriteTeams || [];
  const topTeamPoints = favoriteTeams.reduce((max, team) => Math.max(max, team.points || 0), 0);

  const favoritePrediction = PREDICTION_LABELS[statistics.mostCommonPrediction] || '—';

  const heroMetrics = [
    { key: 'points', value: statistics.totalPoints || 0, label: 'Очок' },
    { key: 'total', value: total, label: 'Прогнозів' },
    { key: 'exact', value: statistics.correctScore || 0, label: 'Точних рахунків' },
    { key: 'accuracy', value: `${toPercent(statistics.correctResult || 0, total)}%`, label: 'Влучність' },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroContent}>
          <button type="button" className={styles.backButton} onClick={() => navigate(-1)}>
            <ArrowLeftIcon className={styles.buttonIcon} />
            Назад
          </button>

          <div className={styles.heroMain}>
            <div className={styles.heroIdentity}>
              <span className={styles.avatar}>
                {avatarUrl ? <img src={avatarUrl} alt={profileDisplayName} /> : initials}
              </span>
              <div className={styles.heroText}>
                <span className={styles.heroEyebrow}>
                  <UserIcon className={styles.heroEyebrowIcon} />
                  Профіль гравця
                </span>
                <h1 className={styles.heroTitle}>{profileDisplayName}</h1>
                <p className={styles.heroSubtitle}>
                  {hasPredictions
                    ? 'Статистика прогнозів гравця в цьому турнірі'
                    : 'Гравець ще не зробив жодного прогнозу в цьому турнірі'}
                </p>
              </div>
            </div>

            <div className={styles.heroMetrics}>
              {heroMetrics.map((metric) => (
                <div className={styles.heroMetric} key={metric.key}>
                  <span className={styles.heroMetricValue}>{metric.value}</span>
                  <span className={styles.heroMetricLabel}>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!hasPredictions ? (
        <div className={styles.emptyCard}>
          <span className={styles.emptyIcon}>
            <EmptyIcon />
          </span>
          <h2 className={styles.emptyTitle}>Ще немає прогнозів</h2>
          <p className={styles.emptyText}>Статистика зʼявиться після першого зіграного матчу з прогнозом.</p>
        </div>
      ) : (
        <>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Ефективність прогнозів</h2>
            <span className={styles.sectionMeta}>{total} прогнозів</span>
          </div>

          <div className={styles.grid}>
            {accuracyCards.map((card, index) => (
              <article
                className={cn(styles.card, styles[card.tone])}
                key={card.key}
                style={{ '--i': index } as React.CSSProperties}>
                <div className={styles.cardGlow} aria-hidden />
                <p className={styles.cardValue}>
                  {card.value}
                  <span className={styles.cardUnit}>з {total}</span>
                </p>
                <span className={styles.cardLabel}>{card.label}</span>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <div className={styles.cardBar}>
                  <span className={styles.cardBarFill} style={{ width: `${card.percent}%` }} />
                </div>
                <span className={styles.cardPercent}>{card.percent}% матчів</span>
              </article>
            ))}
          </div>

          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Серії</h2>
            <span className={styles.sectionMeta}>Найдовші відрізки поспіль</span>
          </div>

          <div className={styles.streaks}>
            {streaks.map((streak, index) => (
              <div
                className={cn(styles.streak, styles[streak.tone])}
                key={streak.key}
                style={{ '--i': index } as React.CSSProperties}>
                <span className={styles.streakIcon}>
                  <FlameIcon />
                </span>
                <div className={styles.streakText}>
                  <p className={styles.streakTitle}>{streak.title}</p>
                  <p className={styles.streakMeta}>{streak.meta}</p>
                </div>
                <span className={styles.streakValue}>{streak.value}</span>
              </div>
            ))}
          </div>

          <div className={styles.layout}>
            <section className={styles.panel}>
              <header className={styles.panelHead}>
                <span className={styles.panelIcon}>
                  <ChartIcon />
                </span>
                <div className={styles.panelHeadText}>
                  <h2 className={styles.panelTitle}>Вгадані переможці</h2>
                  <p className={styles.panelMeta}>Розподіл між господарями та гостями</p>
                </div>
              </header>

              <div className={styles.splitBar}>
                <span className={cn(styles.splitFill, styles.splitHome)} style={{ width: `${homeShare}%` }} />
                <span className={cn(styles.splitFill, styles.splitAway)} style={{ width: `${100 - homeShare}%` }} />
              </div>

              <div className={styles.splitLegend}>
                <div className={styles.splitItem}>
                  <span className={cn(styles.splitDot, styles.splitHome)} />
                  <span className={styles.splitLabel}>Перемоги господарів</span>
                  <span className={styles.splitValue}>{correctHome}</span>
                </div>
                <div className={styles.splitItem}>
                  <span className={cn(styles.splitDot, styles.splitAway)} />
                  <span className={styles.splitLabel}>Перемоги гостей</span>
                  <span className={styles.splitValue}>{correctAway}</span>
                </div>
              </div>

              <div className={styles.factRow}>
                <span className={styles.factLabel}>Найчастіший прогноз</span>
                <span className={styles.factPill}>
                  <BallIcon className={styles.factIcon} />
                  {favoritePrediction}
                </span>
              </div>
            </section>

            <section className={styles.panel}>
              <header className={styles.panelHead}>
                <span className={styles.panelIcon}>
                  <TargetIcon />
                </span>
                <div className={styles.panelHeadText}>
                  <h2 className={styles.panelTitle}>Улюблені рахунки</h2>
                  <p className={styles.panelMeta}>Найчастіші комбінації гравця</p>
                </div>
              </header>

              <div className={styles.scoreList}>
                <div className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>Найчастіший вгаданий рахунок</span>
                  <span className={cn(styles.scoreValue, styles.scoreValueAccent)}>
                    {isScore(statistics.mostCommonCorrectScore) ? statistics.mostCommonCorrectScore : '—'}
                  </span>
                </div>
                <div className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>Найпопулярніший прогноз</span>
                  <span className={styles.scoreValue}>
                    {isScore(statistics.mostPopularPredictedScore) ? statistics.mostPopularPredictedScore : '—'}
                  </span>
                </div>
                <div className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>Влучність точного рахунку</span>
                  <span className={styles.scoreValue}>{toPercent(statistics.correctScore || 0, total)}%</span>
                </div>
              </div>
            </section>
          </div>

          {favoriteTeams.length > 0 && (
            <>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Улюблені команди</h2>
                <span className={styles.sectionMeta}>Найбільше зароблених очок</span>
              </div>

              <div className={styles.teams}>
                {favoriteTeams.map((team, index) => (
                  <div className={styles.team} key={`${team.team}-${index}`} style={{ '--i': index } as React.CSSProperties}>
                    <span className={cn(styles.teamRank, { [styles.teamRankTop]: index === 0 })}>
                      {index === 0 ? <StarIcon className={styles.teamRankIcon} /> : index + 1}
                    </span>
                    <div className={styles.teamText}>
                      <p className={styles.teamName}>{team.team}</p>
                      <div className={styles.teamBar}>
                        <span
                          className={styles.teamBarFill}
                          style={{ width: `${topTeamPoints > 0 ? Math.round((team.points / topTeamPoints) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                    <span className={styles.teamPoints}>{team.points}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
