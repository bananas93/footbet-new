import { useEffect, useMemo } from 'react';
import cn from 'classnames';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'store';
import { getTournaments } from 'store/slices/tournament';
import { getProfile } from 'store/slices/profile';
import { getUserDisplayName, getUserInitials, resolveAssetUrl } from 'helpers';
import styles from './Profile.module.scss';
import { useI18n } from 'i18n';

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

const EMPTY_STATISTICS = {
  total: 0,
  totalPoints: 0,
  correctScore: 0,
  correctDifference: 0,
  fivePlusGoals: 0,
  correctResult: 0,
  correctScorePercentage: 0,
  correctResultPercentage: 0,
  correctScorePerRow: 0,
  correctResultPerRow: 0,
  longestLosingStreak: 0,
  mostCommonCorrectScore: '',
  correctHomePredictions: 0,
  correctAwayPredictions: 0,
  mostCommonPrediction: 'draw' as const,
  topFiveFavoriteTeams: [] as Array<{ team: string; points: number }>,
  mostPopularPredictedScore: '',
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
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading } = useAppSelector((state) => state.profile.getProfileRequest);
  const tournaments = useAppSelector((state) => state.tournament.tournaments);
  const { userId, tournamentId } = useParams<{ userId: string; tournamentId: string }>();
  const queryTournamentId = searchParams.get('tournamentId');

  const parsedRouteTournamentId = tournamentId ? Number(tournamentId) : NaN;
  const selectedTournamentId =
    queryTournamentId || (Number.isFinite(parsedRouteTournamentId) ? String(parsedRouteTournamentId) : 'all');
  const selectedTournamentNumeric = selectedTournamentId === 'all' ? null : Number(selectedTournamentId);

  const selectedTournamentName = useMemo(() => {
    if (selectedTournamentId === 'all') {
      return t('pages.profile.allTournaments');
    }

    return (
      tournaments.find((item) => String(item.id) === selectedTournamentId)?.name ||
      t('pages.profile.selectedTournament')
    );
  }, [selectedTournamentId, t, tournaments]);

  useEffect(() => {
    if (!tournaments.length) {
      dispatch(getTournaments());
    }
  }, [dispatch, tournaments.length]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await dispatch(getProfile({ userId: userId || '', tournamentId: selectedTournamentNumeric })).unwrap();
      } catch (err: any) {
        console.error(err.message);
      }
    };

    fetchUser();
  }, [dispatch, selectedTournamentNumeric, userId]);

  const handleTournamentFilterChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') {
      next.delete('tournamentId');
    } else {
      next.set('tournamentId', value);
    }
    setSearchParams(next, { replace: true });
  };

  const profileDisplayName = getUserDisplayName(data?.user?.name, data?.user?.nickname);

  useEffect(() => {
    if (data?.user) {
      document.title = `${profileDisplayName} | Footbet`;
    }

    return () => {
      document.title = t('app.defaultTitle');
    };
  }, [data?.user, profileDisplayName, t]);

  const statistics = data?.statistics || EMPTY_STATISTICS;

  const accuracyCards = useMemo(() => {
    const total = statistics.total || 0;

    return [
      {
        key: 'score',
        tone: 'gold' as Tone,
        label: t('pages.profile.accuracyCards.score.label'),
        title: t('pages.profile.accuracyCards.score.title'),
        value: statistics.correctScore || 0,
        percent: toPercent(statistics.correctScore || 0, total),
      },
      {
        key: 'result',
        tone: 'teal' as Tone,
        label: t('pages.profile.accuracyCards.result.label'),
        title: t('pages.profile.accuracyCards.result.title'),
        value: statistics.correctResult || 0,
        percent: toPercent(statistics.correctResult || 0, total),
      },
      {
        key: 'difference',
        tone: 'blue' as Tone,
        label: t('pages.profile.accuracyCards.difference.label'),
        title: t('pages.profile.accuracyCards.difference.title'),
        value: statistics.correctDifference || 0,
        percent: toPercent(statistics.correctDifference || 0, total),
      },
      {
        key: 'fivePlus',
        tone: 'orange' as Tone,
        label: t('pages.profile.accuracyCards.fivePlus.label'),
        title: t('pages.profile.accuracyCards.fivePlus.title'),
        value: statistics.fivePlusGoals || 0,
        percent: toPercent(statistics.fivePlusGoals || 0, total),
      },
    ];
  }, [statistics, t]);

  const streaks = useMemo(() => {
    return [
      {
        key: 'scoreRow',
        tone: 'gold' as Tone,
        title: t('pages.profile.streakCards.scoreRow.title'),
        meta: t('pages.profile.streakCards.scoreRow.meta'),
        value: statistics.correctScorePerRow || 0,
      },
      {
        key: 'resultRow',
        tone: 'teal' as Tone,
        title: t('pages.profile.streakCards.resultRow.title'),
        meta: t('pages.profile.streakCards.resultRow.meta'),
        value: statistics.correctResultPerRow || 0,
      },
      {
        key: 'losing',
        tone: 'orange' as Tone,
        title: t('pages.profile.streakCards.losing.title'),
        meta: t('pages.profile.streakCards.losing.meta'),
        value: statistics.longestLosingStreak || 0,
      },
    ];
  }, [statistics, t]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!userId) {
    return <ProfileMessage title={t('pages.profile.invalidLinkTitle')} text={t('pages.profile.invalidLinkText')} />;
  }

  if (!data) {
    return <ProfileMessage title={t('pages.profile.notAvailableTitle')} text={t('pages.profile.notAvailableText')} />;
  }

  const total = statistics.total || 0;
  const hasPredictions = total > 0;
  const isAllTournaments = selectedTournamentId === 'all';

  const avatarUrl = resolveAssetUrl(data.user?.avatar);
  const initials = getUserInitials(data.user?.name, data.user?.nickname);

  const correctHome = statistics.correctHomePredictions || 0;
  const correctAway = statistics.correctAwayPredictions || 0;
  const sidesTotal = correctHome + correctAway;
  const homeShare = sidesTotal > 0 ? Math.round((correctHome / sidesTotal) * 100) : 50;

  const favoriteTeams = statistics.topFiveFavoriteTeams || [];
  const topTeamPoints = favoriteTeams.reduce((max, team) => Math.max(max, team.points || 0), 0);

  const predictionLabels: Record<string, string> = {
    home: t('pages.profile.predictionHome'),
    away: t('pages.profile.predictionAway'),
    draw: t('pages.profile.predictionDraw'),
  };

  const favoritePrediction = predictionLabels[statistics.mostCommonPrediction] || '—';

  const heroMetrics = [
    { key: 'points', value: statistics.totalPoints || 0, label: t('pages.profile.metricPoints') },
    { key: 'total', value: total, label: t('pages.profile.metricPredictions') },
    { key: 'exact', value: statistics.correctScore || 0, label: t('pages.profile.metricExact') },
    {
      key: 'accuracy',
      value: `${toPercent(statistics.correctResult || 0, total)}%`,
      label: t('pages.profile.metricAccuracy'),
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroContent}>
          <button type="button" className={styles.backButton} onClick={() => navigate(-1)}>
            <ArrowLeftIcon className={styles.buttonIcon} />
            {t('pages.profile.back')}
          </button>

          <div className={styles.heroMain}>
            <div className={styles.heroIdentity}>
              <span className={styles.avatar}>
                {avatarUrl ? <img src={avatarUrl} alt={profileDisplayName} /> : initials}
              </span>
              <div className={styles.heroText}>
                <span className={styles.heroEyebrow}>
                  <UserIcon className={styles.heroEyebrowIcon} />
                  {t('pages.profile.playerProfile')}
                </span>
                <h1 className={styles.heroTitle}>{profileDisplayName}</h1>
                <p className={styles.heroSubtitle}>
                  {hasPredictions
                    ? isAllTournaments
                      ? t('pages.profile.subtitleAll')
                      : t('pages.profile.subtitleSelected')
                    : isAllTournaments
                      ? t('pages.profile.subtitleNoPredictionsAll')
                      : t('pages.profile.subtitleNoPredictionsSelected')}
                </p>
                <div className={styles.filterRow}>
                  <span className={styles.filterLabel}>{t('pages.profile.filterLabel')}</span>
                  <select
                    className={styles.filterSelect}
                    value={selectedTournamentId}
                    onChange={(e) => handleTournamentFilterChange(e.target.value)}>
                    <option value="all">{t('pages.profile.allTournaments')}</option>
                    {tournaments.map((item) => (
                      <option key={item.id} value={String(item.id)}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
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
          <h2 className={styles.emptyTitle}>{t('pages.profile.emptyPredictionsTitle')}</h2>
          <p className={styles.emptyText}>
            {isAllTournaments
              ? t('pages.profile.emptyPredictionsAll')
              : t('pages.profile.emptyPredictionsSelected', undefined, { name: selectedTournamentName })}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('pages.profile.efficiencyTitle')}</h2>
            <span className={styles.sectionMeta}>{t('pages.profile.efficiencyMeta', undefined, { count: total })}</span>
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
                  <span className={styles.cardUnit}>
                    {t('pages.profile.from')} {total}
                  </span>
                </p>
                <span className={styles.cardLabel}>{card.label}</span>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <div className={styles.cardBar}>
                  <span className={styles.cardBarFill} style={{ width: `${card.percent}%` }} />
                </div>
                <span className={styles.cardPercent}>
                  {t('pages.profile.matchesPercent', undefined, { count: card.percent })}
                </span>
              </article>
            ))}
          </div>

          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('pages.profile.streaksTitle')}</h2>
            <span className={styles.sectionMeta}>{t('pages.profile.streaksMeta')}</span>
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
                  <h2 className={styles.panelTitle}>{t('pages.profile.winsTitle')}</h2>
                  <p className={styles.panelMeta}>{t('pages.profile.winsMeta')}</p>
                </div>
              </header>

              <div className={styles.splitBar}>
                <span className={cn(styles.splitFill, styles.splitHome)} style={{ width: `${homeShare}%` }} />
                <span className={cn(styles.splitFill, styles.splitAway)} style={{ width: `${100 - homeShare}%` }} />
              </div>

              <div className={styles.splitLegend}>
                <div className={styles.splitItem}>
                  <span className={cn(styles.splitDot, styles.splitHome)} />
                  <span className={styles.splitLabel}>{t('pages.profile.winsHome')}</span>
                  <span className={styles.splitValue}>{correctHome}</span>
                </div>
                <div className={styles.splitItem}>
                  <span className={cn(styles.splitDot, styles.splitAway)} />
                  <span className={styles.splitLabel}>{t('pages.profile.winsAway')}</span>
                  <span className={styles.splitValue}>{correctAway}</span>
                </div>
              </div>

              <div className={styles.factRow}>
                <span className={styles.factLabel}>{t('pages.profile.mostCommonPrediction')}</span>
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
                  <h2 className={styles.panelTitle}>{t('pages.profile.favoriteScoresTitle')}</h2>
                  <p className={styles.panelMeta}>{t('pages.profile.favoriteScoresMeta')}</p>
                </div>
              </header>

              <div className={styles.scoreList}>
                <div className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>{t('pages.profile.mostCommonCorrect')}</span>
                  <span className={cn(styles.scoreValue, styles.scoreValueAccent)}>
                    {isScore(statistics.mostCommonCorrectScore) ? statistics.mostCommonCorrectScore : '—'}
                  </span>
                </div>
                <div className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>{t('pages.profile.mostPopularPredicted')}</span>
                  <span className={styles.scoreValue}>
                    {isScore(statistics.mostPopularPredictedScore) ? statistics.mostPopularPredictedScore : '—'}
                  </span>
                </div>
                <div className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>{t('pages.profile.exactAccuracy')}</span>
                  <span className={styles.scoreValue}>{toPercent(statistics.correctScore || 0, total)}%</span>
                </div>
              </div>
            </section>
          </div>

          {favoriteTeams.length > 0 && (
            <>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>{t('pages.profile.favoriteTeamsTitle')}</h2>
                <span className={styles.sectionMeta}>{t('pages.profile.favoriteTeamsMeta')}</span>
              </div>

              <div className={styles.teams}>
                {favoriteTeams.map((team, index) => (
                  <div
                    className={styles.team}
                    key={`${team.team}-${index}`}
                    style={{ '--i': index } as React.CSSProperties}>
                    <span className={cn(styles.teamRank, { [styles.teamRankTop]: index === 0 })}>
                      {index === 0 ? <StarIcon className={styles.teamRankIcon} /> : index + 1}
                    </span>
                    <div className={styles.teamText}>
                      <p className={styles.teamName}>{team.team}</p>
                      <div className={styles.teamBar}>
                        <span
                          className={styles.teamBarFill}
                          style={{
                            width: `${topTeamPoints > 0 ? Math.round((team.points / topTeamPoints) * 100) : 0}%`,
                          }}
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
