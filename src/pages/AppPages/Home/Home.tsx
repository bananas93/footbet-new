import { useMemo } from 'react';
import cn from 'classnames';
import { Link } from 'react-router-dom';
import { useAppSelector } from 'store';
import { resolveAssetUrl } from 'helpers';
import { TournamentStatus } from 'interfaces';
import styles from './Home.module.scss';

const statusLabels: Record<TournamentStatus, string> = {
  scheduled: 'Заплановано',
  live: 'Live',
  completed: 'Завершено',
};

const iconProps = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M8 4h8v5.2a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5.5H5.6A1.6 1.6 0 0 0 4 7.1v.6a3.8 3.8 0 0 0 3.8 3.8H8" />
    <path d="M16 5.5h2.4A1.6 1.6 0 0 1 20 7.1v.6a3.8 3.8 0 0 1-3.8 3.8H16" />
    <path d="M12 13.2V16" />
    <path d="M9.6 20h4.8l-.6-3h-3.6L9.6 20Z" />
    <path d="M8.4 20h7.2" />
  </svg>
);

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M5 12h13M13 7l5 5-5 5" />
  </svg>
);

const Home: React.FC = () => {
  const { isLoading } = useAppSelector((state) => state.tournament.getTournamentsRequest);
  const { tournaments } = useAppSelector((state) => state.tournament);

  const overview = useMemo(() => {
    return {
      total: tournaments.length,
      live: tournaments.filter((item) => item.status === 'live').length,
      scheduled: tournaments.filter((item) => item.status === 'scheduled').length,
      completed: tournaments.filter((item) => item.status === 'completed').length,
    };
  }, [tournaments]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <span className={styles.heroEyebrow}>
              <TrophyIcon className={styles.heroEyebrowIcon} />
              Footbet
            </span>
            <h1 className={styles.heroTitle}>Турніри прогнозистів</h1>
            <p className={styles.heroSubtitle}>
              Обирайте турнір, прогнозуйте матчі та змагайтеся з друзями у загальній лізі й приватних кімнатах
            </p>
          </div>

          {!isLoading && !!overview.total && (
            <div className={styles.heroMetrics}>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.total}</span>
                <span className={styles.heroMetricLabel}>Турнірів</span>
              </div>
              <div className={cn(styles.heroMetric, { [styles.heroMetricLive]: overview.live > 0 })}>
                <span className={styles.heroMetricValue}>{overview.live}</span>
                <span className={styles.heroMetricLabel}>Активних</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.scheduled}</span>
                <span className={styles.heroMetricLabel}>Заплановано</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.completed}</span>
                <span className={styles.heroMetricLabel}>Завершено</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {!isLoading && !!tournaments.length && (
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Усі турніри</h2>
          <span className={styles.sectionMeta}>{tournaments.length} доступно</span>
        </div>
      )}

      {isLoading && (
        <div className={styles.grid}>
          {Array.from({ length: 4 }, (_, index) => (
            <div className={styles.skeletonCard} key={index}>
              <div className={styles.skeletonTop}>
                <span className={cn(styles.skeletonBlock, styles.skeletonLogo)} />
                <span className={cn(styles.skeletonBlock, styles.skeletonBadge)} />
              </div>
              <span className={cn(styles.skeletonBlock, styles.skeletonLine)} />
              <span className={cn(styles.skeletonBlock, styles.skeletonLineShort)} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !tournaments.length && (
        <section className={styles.emptyCard}>
          <span className={styles.emptyIcon}>
            <TrophyIcon />
          </span>
          <h3 className={styles.emptyTitle}>Турнірів поки немає</h3>
          <p className={styles.empty}>Щойно з’явиться новий турнір, він буде тут.</p>
        </section>
      )}

      {!isLoading && !!tournaments.length && (
        <div className={styles.grid}>
          {tournaments.map((tournament, index) => (
            <Link
              to={`/tournament/${tournament.id}`}
              className={cn(styles.card, styles[tournament.status])}
              key={tournament.id}
              style={{ '--i': index } as React.CSSProperties}>
              <div className={styles.cardGlow} aria-hidden />

              <div className={styles.cardTop}>
                <span className={styles.cardLogo}>
                  <img src={resolveAssetUrl(tournament.logo)} alt={tournament.name} />
                </span>
                <span className={styles.statusBadge}>
                  <span className={styles.statusDot} />
                  {statusLabels[tournament.status]}
                </span>
              </div>

              <h3 className={styles.cardTitle}>{tournament.name}</h3>

              <div className={styles.chips}>
                <span className={styles.chip}>{tournament.type === 'national' ? 'Національний' : 'Клубний'}</span>
                {tournament.groupNumber > 1 && <span className={styles.chip}>Груп: {tournament.groupNumber}</span>}
                {tournament.knockoutRound > 0 && <span className={styles.chip}>Плей-оф: {tournament.knockoutRound}</span>}
              </div>

              <span className={styles.cardCta}>
                Перейти до турніру
                <ArrowIcon className={styles.cardCtaIcon} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
