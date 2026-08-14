import { useMemo, useState } from 'react';
import cn from 'classnames';
import { useAppSelector } from 'store';
import { useTournament } from '../../Tournament';
import { IStandingsItem } from 'interfaces';
import { useMobile } from 'hooks';
import { getLeagueLabel, resolveAssetUrl } from 'helpers';
import styles from './Standings.module.scss';

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

const normalizeGroupName = (value: string) => value.replace(/^(group|група|гр\.?)\s*/i, '').trim() || value.trim();

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

const StandingsTable: React.FC<StandingsTableProps> = ({ title, meta, badge, items, isMobile, getZone, formLimit }) => (
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
  const [activeLeague, setActiveLeague] = useState<string | null>(null);

  const standings = useAppSelector((state) => state.tournament.standings)[tournament.id];
  const groups = useMemo(() => Object.entries(standings?.standings || {}), [standings]);
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

  // Кількість ліг приходить з бекенду, розмітка будується з даних турнірної таблиці
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

  const hasDirectZone = tournament.directNextRound > 0;
  const hasPlayoffZone = tournament.playoffRound > 0;

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

  const getGroupZone = (leagueKey: string | null, index: number): Zone => {
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

    if (tournament.directNextRound > index) {
      return 'playoff';
    }

    if (tournament.playoffRound + tournament.directNextRound > index) {
      return 'knockout';
    }

    return null;
  };

  const renderLeagueLegend = (section: LeagueSection) => {
    if (!isNationsLeague) {
      if (section.key !== topLeagueKey || (!hasDirectZone && !hasPlayoffZone)) {
        return null;
      }

      return (
        <div className={cn(styles.legend, styles.leagueLegend)}>
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
          <span className={styles.legendHint}>Зони виходу діють для цієї ліги</span>
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
              1-2 місце: плей-оф
            </span>
            <span className={cn(styles.legendItem, styles.relegationPlayoff)}>
              <span className={styles.legendDot} />
              3 місце: стикові матчі
            </span>
            <span className={cn(styles.legendItem, styles.relegation)}>
              <span className={styles.legendDot} />
              4 місце: пониження
            </span>
          </>
        ) : (
          <>
            <span className={cn(styles.legendItem, styles.promotion)}>
              <span className={styles.legendDot} />
              1 місце: підвищення
            </span>
            <span className={cn(styles.legendItem, styles.promotionPlayoff)}>
              <span className={styles.legendDot} />
              2 місце: стики на підвищення
            </span>
            {!isBottomLeague && (
              <span className={cn(styles.legendItem, styles.relegationPlayoff)}>
                <span className={styles.legendDot} />
                3 місце: стики на пониження
              </span>
            )}
            {!isBottomLeague && (
              <span className={cn(styles.legendItem, styles.relegation)}>
                <span className={styles.legendDot} />
                4 місце: пониження
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
    const title = isSingleTable ? 'Турнірна таблиця' : `Група ${entry.group}`;
    const meta = inLeague ? `${tournament.name} • Ліга ${section?.label}` : tournament.name;

    return (
      <StandingsTable
        key={entry.key}
        title={title}
        meta={meta}
        badge={isSingleTable ? undefined : entry.group}
        items={entry.items}
        isMobile={isMobile}
        formLimit={isMobile ? -3 : undefined}
        getZone={(index) => getGroupZone(section?.key ?? null, index)}
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
              Турнірна таблиця
            </span>
            <h2 className={styles.heroTitle}>{tournament.name}</h2>
            <p className={styles.heroSubtitle}>
              {isMultiLeague
                ? 'Ліги, позиції команд, форма останніх матчів та зони виходу далі'
                : 'Позиції команд, форма останніх матчів та зони виходу далі'}
            </p>
          </div>

          {!!allTeams.length && (
            <div className={styles.heroMetrics}>
              {isMultiLeague && (
                <div className={styles.heroMetric}>
                  <span className={styles.heroMetricValue}>{overview.leagues}</span>
                  <span className={styles.heroMetricLabel}>Ліг</span>
                </div>
              )}
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
              {!isMultiLeague && (
                <div className={styles.heroMetric}>
                  <span className={styles.heroMetricValue}>{overview.goals}</span>
                  <span className={styles.heroMetricLabel}>Голів</span>
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
            Всі ліги
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
              Ліга {section.label}
            </button>
          ))}
        </div>
      )}

      {!!allTeams.length && !isMultiLeague && (isNationsLeague || hasDirectZone || hasPlayoffZone) && (
        <div className={styles.legend}>
          {isNationsLeague ? (
            <>
              <span className={cn(styles.legendItem, styles.playoff)}>
                <span className={styles.legendDot} />
                Ліга A: 1-2 місце вихід у плей-оф
              </span>
              <span className={cn(styles.legendItem, styles.relegationPlayoff)}>
                <span className={styles.legendDot} />
                3 місце: стикові матчі
              </span>
              <span className={cn(styles.legendItem, styles.relegation)}>
                <span className={styles.legendDot} />
                4 місце: пониження в лігу нижче
              </span>
              <span className={cn(styles.legendItem, styles.promotion)}>
                <span className={styles.legendDot} />
                Нижчі ліги: 1 місце підвищення, 2 місце стики на підвищення
              </span>
            </>
          ) : (
            <>
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
            </>
          )}
          <span className={styles.legendHint}>
            {isNationsLeague
              ? 'Формат Nations League: підвищення/пониження між лігами A/B/C/D'
              : isMultiLeague
                ? `Зони виходу — лише Ліга ${leagues[0].label}`
                : 'Форма: останні матчі, зліва найдавніший'}
          </span>
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
                    <h3 className={styles.leagueTitle}>Ліга {section.label}</h3>
                    <p className={styles.leagueMeta}>
                      {section.groups.length > 1 ? `${section.groups.length} груп • ` : ''}
                      {section.teams} команд
                    </p>
                  </div>
                  {section.key === topLeagueKey && (isNationsLeague || hasDirectZone || hasPlayoffZone) && (
                    <span className={styles.leagueTag}>{isNationsLeague ? 'Плей-оф / стики' : 'Вихід у плей-оф'}</span>
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
              title={section.label ? `3-тє місце · Ліга ${section.label}` : 'Команди які зайняли 3-тє місце'}
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
