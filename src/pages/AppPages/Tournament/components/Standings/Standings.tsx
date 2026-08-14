import cn from 'classnames';
import { useAppSelector } from 'store';
import { useTournament } from '../../Tournament';
import { IStandingsItem } from 'interfaces';
import { useMobile } from 'hooks';
import { resolveAssetUrl } from 'helpers';
import styles from './Standings.module.scss';

type Zone = 'playoff' | 'knockout' | null;

type StandingsTableProps = {
  title: string;
  meta?: string;
  badge?: string;
  items: IStandingsItem[];
  isMobile: boolean;
  getZone: (index: number) => Zone;
  formLimit?: number;
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

const StandingsTable: React.FC<StandingsTableProps> = ({
  title,
  meta,
  badge,
  items,
  isMobile,
  getZone,
  formLimit,
}) => (
  <section className={styles.tableCard}>
    <header className={styles.tableHead}>
      {badge && <span className={styles.groupBadge}>{badge}</span>}
      <div className={styles.tableHeadText}>
        <h3 className={styles.tableTitle}>{title}</h3>
        {meta && <p className={styles.tableMeta}>{meta}</p>}
      </div>
      <span className={styles.tableCount}>{items.length} команд</span>
    </header>

    <div className={styles.tableInner}>
      <div className={cn(styles.row, styles.headRow)}>
        <div className={styles.colPos}>#</div>
        <div className={styles.colTeam}>Команда</div>
        <div className={styles.stats}>
          <p className={styles.col}>{isMobile ? 'М' : 'Матчів'}</p>
          <p className={cn(styles.col, styles.hideMobile)} title="Виграв">
            В
          </p>
          <p className={cn(styles.col, styles.hideMobile)} title="Нічия">
            Н
          </p>
          <p className={cn(styles.col, styles.hideMobile)} title="Поразка">
            П
          </p>
          <p className={styles.col}>Голи</p>
          <p className={cn(styles.col, styles.colForm)}>{isMobile ? 'Ф' : 'Форма'}</p>
          <p className={cn(styles.col, styles.colPoints)}>{isMobile ? 'Очк.' : 'Очок'}</p>
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
                    <span key={formIndex} className={cn(styles.formItem, styles[result])} title={result} />
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

const Standings: React.FC = () => {
  const { tournament } = useTournament();
  const isMobile = useMobile();

  const standings = useAppSelector((state) => state.tournament.standings)[tournament.id] || [];
  const groups = Object.entries(standings.standings || {});
  const thirdPlace = standings.thirdPlacesStandings || [];

  const allTeams = groups.flatMap(([, items]) => items as unknown as IStandingsItem[]);
  const overview = {
    groups: groups.length,
    teams: allTeams.length,
    matches: Math.floor(allTeams.reduce((acc, item) => acc + item.played, 0) / 2),
    goals: allTeams.reduce((acc, item) => acc + item.goalsScored, 0),
  };

  const hasDirectZone = tournament.directNextRound > 0;
  const hasPlayoffZone = tournament.playoffRound > 0;

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <span className={styles.heroEyebrow}>
              <TableIcon />
              Турнірна таблиця
            </span>
            <h2 className={styles.heroTitle}>{tournament.name}</h2>
            <p className={styles.heroSubtitle}>Позиції команд, форма останніх матчів та зони виходу далі</p>
          </div>

          {!!allTeams.length && (
            <div className={styles.heroMetrics}>
              {tournament.groupNumber > 1 && (
                <div className={styles.heroMetric}>
                  <span className={styles.heroMetricValue}>{overview.groups}</span>
                  <span className={styles.heroMetricLabel}>Груп</span>
                </div>
              )}
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.teams}</span>
                <span className={styles.heroMetricLabel}>Команд</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.matches}</span>
                <span className={styles.heroMetricLabel}>Матчів</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.goals}</span>
                <span className={styles.heroMetricLabel}>Голів</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {!!allTeams.length && (hasDirectZone || hasPlayoffZone) && (
        <div className={styles.legend}>
          {hasDirectZone && (
            <span className={cn(styles.legendItem, styles.playoff)}>
              <span className={styles.legendDot} />
              Прямий вихід у наступний раунд
            </span>
          )}
          {hasPlayoffZone && (
            <span className={cn(styles.legendItem, styles.knockout)}>
              <span className={styles.legendDot} />
              Раунд плей-оф
            </span>
          )}
          <span className={styles.legendHint}>Форма: останні матчі, зліва найдавніший</span>
        </div>
      )}

      {!groups.length && (
        <section className={styles.emptyCard}>
          <span className={styles.emptyIcon}>
            <TableIcon />
          </span>
          <h3 className={styles.emptyTitle}>Таблиця ще не сформована</h3>
          <p className={styles.empty}>Дані з’являться після перших матчів турніру.</p>
        </section>
      )}

      {!!groups.length && (
        <div className={cn(styles.groups, { [styles.one]: tournament.groupNumber === 1 })}>
          {groups.map(([group, groupItems]) => {
            const items = groupItems as unknown as IStandingsItem[];
            const isSingleTable = tournament.groupNumber === 1;

            return (
              <StandingsTable
                key={group}
                title={isSingleTable ? 'Турнірна таблиця' : `Група ${group}`}
                meta={tournament.name}
                badge={isSingleTable ? undefined : group}
                items={items}
                isMobile={isMobile}
                formLimit={isMobile ? -3 : undefined}
                getZone={(index) => {
                  if (tournament.directNextRound > index) {
                    return 'playoff';
                  }

                  if (tournament.playoffRound + tournament.directNextRound > index) {
                    return 'knockout';
                  }

                  return null;
                }}
              />
            );
          })}
        </div>
      )}

      {tournament.type === 'national' && !!thirdPlace.length && (
        <div className={cn(styles.groups, styles.one)}>
          <StandingsTable
            title="Команди які зайняли 3-тє місце"
            meta={tournament.name}
            items={thirdPlace}
            isMobile={isMobile}
            getZone={(index) => (index <= 3 ? 'knockout' : null)}
          />
        </div>
      )}
    </div>
  );
};

export default Standings;
