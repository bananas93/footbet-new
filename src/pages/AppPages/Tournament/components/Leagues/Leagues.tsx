import { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { Link } from 'react-router-dom';
import { useAppSelector } from 'store';
import { useMobile } from 'hooks';
import { getUserInitials, resolveAssetUrl } from 'helpers';
import { useTournament } from '../../Tournament';
import styles from './Leagues.module.scss';
import { useI18n } from 'i18n';

const PAGE_SIZE = 25;

type PodiumTone = 'gold' | 'silver' | 'bronze';

const podiumTones: PodiumTone[] = ['gold', 'silver', 'bronze'];

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.searchIcon}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round">
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);

const FilterIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.pillIcon}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M4 6.5h16M7 12h10M10 17.5h4" />
  </svg>
);

const CrownIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.podiumCrown}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M4 7.5l3.4 2.6L12 4l4.6 6.1L20 7.5 18.4 18H5.6L4 7.5Z" />
  </svg>
);

const Leagues: React.FC = () => {
  const { t } = useI18n();
  const { tournament } = useTournament();
  const isMobile = useMobile();
  const user = useAppSelector((state) => state.user.user);
  const globalTable = useAppSelector((state) => state.predict.table)[tournament.id] || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [visibleRows, setVisibleRows] = useState(PAGE_SIZE);
  const table = globalTable;

  const rankById = useMemo(() => {
    const map = new Map<string, number>();
    table.forEach((row, index) => map.set(row.id, index + 1));
    return map;
  }, [table]);

  const filteredTable = useMemo(() => {
    return table.filter((row) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesName = query ? row.name.toLowerCase().includes(query) : true;
      const matchesActive = onlyActive ? row.totalMatches > 0 || row.points > 0 : true;
      return matchesName && matchesActive;
    });
  }, [onlyActive, searchQuery, table]);

  const shownTable = useMemo(() => filteredTable.slice(0, visibleRows), [filteredTable, visibleRows]);

  const overview = useMemo(() => {
    return {
      players: table.length,
      predicts: table.reduce((acc, item) => acc + item.totalMatches, 0),
      exactScores: table.reduce((acc, item) => acc + item.correctScore, 0),
      leaderPoints: table.length ? table[0].points : 0,
    };
  }, [table]);

  const podium = useMemo(() => table.slice(0, 3), [table]);

  useEffect(() => {
    setVisibleRows(PAGE_SIZE);
  }, [searchQuery, onlyActive]);

  const isFiltering = !!searchQuery.trim() || onlyActive;
  const podiumLabels = [
    t('pages.leagues.podium.champion'),
    t('pages.leagues.podium.second'),
    t('pages.leagues.podium.third'),
  ];

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <span className={styles.heroEyebrow}>
              <CrownIcon />
              {t('pages.leagues.title')}
            </span>
            <h2 className={styles.heroTitle}>{tournament.name}</h2>
            <p className={styles.heroSubtitle}>{t('pages.leagues.subtitle')}</p>
          </div>

          {!!table.length && (
            <div className={styles.heroMetrics}>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.players}</span>
                <span className={styles.heroMetricLabel}>{t('pages.leagues.metrics.players')}</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.predicts}</span>
                <span className={styles.heroMetricLabel}>{t('pages.leagues.metrics.predictions')}</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.exactScores}</span>
                <span className={styles.heroMetricLabel}>{t('pages.leagues.metrics.exactScores')}</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroMetricValue}>{overview.leaderPoints}</span>
                <span className={styles.heroMetricLabel}>{t('pages.leagues.metrics.leaderPoints')}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {!!podium.length && (
        <div className={styles.podium}>
          {podium.map((item, index) => {
            const tone = podiumTones[index];
            const isMe = !!user && item.id === user.id;
            return (
              <article
                className={cn(styles.podiumCard, styles[tone], { [styles.podiumMe]: isMe })}
                key={item.id}
                style={{ '--i': index } as React.CSSProperties}>
                <div className={styles.podiumGlow} aria-hidden="true" />
                <div className={styles.podiumTop}>
                  <span className={styles.podiumPlace}>
                    {index === 0 && <CrownIcon />}
                    {index + 1}
                  </span>
                  <span className={styles.podiumLabel}>{podiumLabels[index]}</span>
                </div>

                <div className={styles.podiumUser}>
                  <span className={styles.podiumAvatar}>
                    {item.avatar ? (
                      <img src={resolveAssetUrl(item.avatar)} alt={item.name} />
                    ) : (
                      getUserInitials(item.name)
                    )}
                  </span>
                  <Link
                    to={`/profile/${item.id}?tournamentId=${tournament.id}`}
                    className={styles.podiumName}
                    title={item.name}>
                    {item.name}
                  </Link>
                </div>

                <p className={styles.podiumPoints}>
                  {item.points}
                  <span className={styles.podiumPointsUnit}>{t('pages.leagues.pointsShort')}</span>
                </p>

                <div className={styles.podiumStats}>
                  <div className={styles.podiumStat}>
                    <span className={styles.podiumStatValue}>{item.correctScore}</span>
                    <span className={styles.podiumStatLabel}>{t('pages.leagues.table.exact')}</span>
                  </div>
                  <div className={styles.podiumStat}>
                    <span className={styles.podiumStatValue}>{item.correctResult}</span>
                    <span className={styles.podiumStatLabel}>{t('pages.leagues.table.result')}</span>
                  </div>
                  <div className={styles.podiumStat}>
                    <span className={styles.podiumStatValue}>{item.totalMatches}</span>
                    <span className={styles.podiumStatLabel}>{t('pages.leagues.table.matches')}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h3 className={styles.panelTitle}>{t('pages.leagues.tableTitle')}</h3>
            <p className={styles.panelSubtitle}>
              {t('pages.leagues.shownOf', undefined, { shown: shownTable.length, total: filteredTable.length })}
              {isFiltering && table.length !== filteredTable.length
                ? ` (${t('pages.leagues.overall', undefined, { total: table.length })})`
                : ''}
            </p>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.search}>
              <SearchIcon />
              <input
                name="searchUser"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('pages.leagues.searchPlaceholder')}
                className={styles.searchInput}
                autoComplete="off"
              />
              {!!searchQuery && (
                <button
                  type="button"
                  className={styles.searchClear}
                  onClick={() => setSearchQuery('')}
                  aria-label={t('pages.leagues.clearSearch')}>
                  ×
                </button>
              )}
            </div>

            <button
              type="button"
              className={cn(styles.pill, { [styles.pillActive]: onlyActive })}
              onClick={() => setOnlyActive((prev) => !prev)}>
              <FilterIcon />
              {onlyActive ? t('pages.leagues.showAll') : t('pages.leagues.onlyActive')}
            </button>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <div className={cn(styles.row, styles.headRow)}>
            <div className={cn(styles.col, styles.colRank)}>#</div>
            <div className={cn(styles.col, styles.colName)}>{t('pages.leagues.table.player')}</div>
            <div className={styles.col}>
              {isMobile ? t('pages.leagues.table.matchesShort') : t('pages.leagues.table.matches')}
            </div>
            <div className={styles.col}>
              {isMobile ? t('pages.leagues.table.exactShort') : t('pages.leagues.table.exact')}
            </div>
            <div className={cn(styles.col, styles.colWide)}>{t('pages.leagues.table.result')}</div>
            <div className={cn(styles.col, styles.colWide)}>{t('pages.leagues.table.differences')}</div>
            <div className={cn(styles.col, styles.colWide)}>{t('pages.leagues.table.fivePlus')}</div>
            <div className={cn(styles.col, styles.colPoints)}>
              {isMobile ? t('pages.leagues.table.pointsShort') : t('pages.leagues.table.points')}
            </div>
          </div>

          {shownTable.map((item) => {
            const rank = rankById.get(item.id) || 0;
            const isMe = !!user && item.id === user.id;
            const tone = rank <= 3 ? podiumTones[rank - 1] : null;

            return (
              <div
                className={cn(styles.row, { [styles.rowMe]: isMe, [styles.rowTop]: !!tone }, tone ? styles[tone] : '')}
                key={item.id}>
                <div className={cn(styles.col, styles.colRank)}>
                  <span className={cn(styles.rank, { [styles.rankMedal]: !!tone })}>{rank}</span>
                </div>
                <div className={cn(styles.col, styles.colName)}>
                  <span className={styles.rowAvatar}>
                    {item.avatar ? (
                      <img src={resolveAssetUrl(item.avatar)} alt={item.name} />
                    ) : (
                      getUserInitials(item.name)
                    )}
                  </span>
                  <Link
                    to={`/profile/${item.id}?tournamentId=${tournament.id}`}
                    className={styles.userLink}
                    title={item.name}>
                    {item.name}
                  </Link>
                  {isMe && <span className={styles.meChip}>{t('pages.leagues.me')}</span>}
                </div>
                <div className={styles.col}>{item.totalMatches}</div>
                <div className={styles.col}>{item.correctScore}</div>
                <div className={cn(styles.col, styles.colWide)}>{item.correctResult}</div>
                <div className={cn(styles.col, styles.colWide)}>{item.correctDifference}</div>
                <div className={cn(styles.col, styles.colWide)}>{item.fivePlusGoals}</div>
                <div className={cn(styles.col, styles.colPoints)}>
                  <span className={styles.points}>{item.points}</span>
                </div>
              </div>
            );
          })}

          {!shownTable.length && (
            <div className={styles.emptyRow}>
              <span className={styles.emptyIcon}>
                <SearchIcon />
              </span>
              <p className={styles.emptyTitle}>
                {isFiltering ? t('pages.leagues.emptyFilteredTitle') : t('pages.leagues.emptyTitle')}
              </p>
              <p className={styles.empty}>
                {isFiltering ? t('pages.leagues.emptyFilteredText') : t('pages.leagues.emptyText')}
              </p>
            </div>
          )}
        </div>

        {visibleRows < filteredTable.length && (
          <div className={styles.moreWrap}>
            <button
              type="button"
              className={styles.moreButton}
              onClick={() => setVisibleRows((prev) => prev + PAGE_SIZE)}>
              {t('pages.leagues.showMore', undefined, {
                count: Math.min(PAGE_SIZE, filteredTable.length - visibleRows),
              })}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Leagues;
