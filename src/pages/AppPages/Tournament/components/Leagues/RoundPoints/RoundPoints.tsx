import { useEffect, useMemo, useRef, useState } from 'react';
import cn from 'classnames';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'store';
import { useMobile } from 'hooks';
import { buildRoundTabs, getUserInitials, normalizeKnockoutRoundName, resolveAssetUrl } from 'helpers';
import { MatchStatus } from 'interfaces';
import { buildRoundPredictsKey, getRoundPredicts, IPredictTableResponse } from 'store/slices/predict';
import { useTournament } from '../../../Tournament';
import styles from './RoundPoints.module.scss';
import { useI18n } from 'i18n';

interface Props {
  table: IPredictTableResponse[];
}

interface IRoundRow {
  userId: string;
  name: string;
  avatar: string;
  points: number;
  predicts: number;
  exact: number;
  rank: number;
}

const PAGE_SIZE = 10;

const TrophyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={styles.eyebrowIcon}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11" />
    <path d="M10 14h4l.6 3.5H9.4L10 14ZM8 20h8" />
  </svg>
);

const RoundPoints: React.FC<Props> = ({ table }) => {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const { tournament } = useTournament();
  const isMobile = useMobile();

  const user = useAppSelector((state) => state.user.user);
  const matches = useAppSelector((state) => state.match.matches)[tournament.id] || [];
  const roundPredicts = useAppSelector((state) => state.predict.roundPredicts);
  const roundPredictsKey = useAppSelector((state) => state.predict.roundPredictsKey);
  const { isLoading, isError } = useAppSelector((state) => state.predict.getRoundPredictsRequest);

  const [selectedRoundKey, setSelectedRoundKey] = useState<string | null>(null);
  const [visibleRows, setVisibleRows] = useState(PAGE_SIZE);

  const rounds = useMemo(() => {
    const knockoutRounds = normalizeKnockoutRoundName(tournament.knockoutRound, tournament.thirdPlaceMatch);
    return buildRoundTabs(matches, tournament.groupMatchNumber, knockoutRounds).filter(
      (round) => !!round.games?.data?.length,
    );
    // `t` is listed so round labels are rebuilt when the language changes:
    // buildRoundTabs translates them internally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, tournament.groupMatchNumber, tournament.knockoutRound, tournament.thirdPlaceMatch, t]);

  // Open on the most recent round that has already been played.
  const defaultRoundKey = useMemo(() => {
    const lastPlayed = [...rounds]
      .reverse()
      .find((round) =>
        (round.games?.data || []).some(
          (match) => match.status === MatchStatus.FINISHED || match.status === MatchStatus.IN_PROGRESS,
        ),
      );

    return lastPlayed?.key || rounds[0]?.key || null;
  }, [rounds]);

  const activeRoundKey =
    selectedRoundKey && rounds.some((round) => round.key === selectedRoundKey) ? selectedRoundKey : defaultRoundKey;

  const activeRound = rounds.find((round) => round.key === activeRoundKey);
  const roundMatches = useMemo(() => activeRound?.games?.data || [], [activeRound]);

  // Only started matches are read. Predictions on a match that has not kicked off
  // must stay private, the same rule the match card follows.
  const startedMatches = useMemo(
    () =>
      roundMatches.filter((match) => match.status === MatchStatus.FINISHED || match.status === MatchStatus.IN_PROGRESS),
    [roundMatches],
  );

  const hasStarted = !!startedMatches.length;
  const isRoundFinished =
    hasStarted &&
    startedMatches.length === roundMatches.length &&
    startedMatches.every((match) => match.status === MatchStatus.FINISHED);

  // Refetch when a score changes: points are recalculated on the server.
  const resultsSignature = useMemo(
    () => startedMatches.map((match) => `${match.id}:${match.status}:${match.homeScore}:${match.awayScore}`).join('|'),
    [startedMatches],
  );

  const cacheKey = activeRoundKey ? buildRoundPredictsKey(tournament.id, activeRoundKey) : '';
  const rows = cacheKey ? roundPredicts[cacheKey] : undefined;
  const isPending = hasStarted && !rows && (isLoading || roundPredictsKey !== cacheKey);

  // Round and results already loaded in this session are not fetched again.
  const loadedSignatures = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!activeRoundKey || !resultsSignature || loadedSignatures.current[cacheKey] === resultsSignature) {
      return;
    }

    const matchIds = resultsSignature.split('|').map((item) => Number(item.split(':')[0]));
    const promise = dispatch(getRoundPredicts({ tournamentId: tournament.id, roundKey: activeRoundKey, matchIds }));

    promise
      .unwrap()
      .then(() => {
        loadedSignatures.current[cacheKey] = resultsSignature;
      })
      .catch(() => {
        // Errors and aborts are handled through the request state.
      });

    return () => {
      promise.abort();
    };
  }, [dispatch, tournament.id, activeRoundKey, cacheKey, resultsSignature]);

  useEffect(() => {
    setVisibleRows(PAGE_SIZE);
  }, [activeRoundKey]);

  const roundListRef = useRef<HTMLDivElement | null>(null);
  const activeChipRef = useRef<HTMLButtonElement | null>(null);

  // Tournaments run 20+ rounds, so the open one has to be scrolled into view.
  useEffect(() => {
    const list = roundListRef.current;
    const chip = activeChipRef.current;

    if (!list || !chip) {
      return;
    }

    list.scrollTo({
      left: chip.offsetLeft - list.clientWidth / 2 + chip.clientWidth / 2,
      behavior: 'smooth',
    });
  }, [activeRoundKey]);

  const profileById = useMemo(() => {
    const map = new Map<string, IPredictTableResponse>();
    table.forEach((item) => map.set(item.id, item));
    return map;
  }, [table]);

  const roundTable = useMemo<IRoundRow[]>(() => {
    if (!rows?.length) {
      return [];
    }

    const matchById = new Map(startedMatches.map((match) => [match.id, match]));
    const byUser = new Map<string, Omit<IRoundRow, 'rank' | 'name' | 'avatar'>>();

    rows.forEach((row) => {
      const match = matchById.get(row.matchId);
      if (!match) {
        return;
      }

      const entry = byUser.get(row.userId) || { userId: row.userId, points: 0, predicts: 0, exact: 0 };
      entry.predicts += 1;
      entry.points += row.points || 0;

      if (
        match.status === MatchStatus.FINISHED &&
        row.homeScore === match.homeScore &&
        row.awayScore === match.awayScore
      ) {
        entry.exact += 1;
      }

      byUser.set(row.userId, entry);
    });

    const sorted = Array.from(byUser.values())
      .map((entry) => {
        const profile = profileById.get(entry.userId);
        return {
          ...entry,
          name: profile?.name || t('pages.leagues.roundPoints.unknownUser'),
          avatar: profile?.avatar || '',
        };
      })
      .sort((a, b) => b.points - a.points || b.exact - a.exact || a.name.localeCompare(b.name));

    // Competition ranking: equal points share a place.
    let lastPoints: number | null = null;
    let lastRank = 0;

    return sorted.map((entry, index) => {
      const rank = lastPoints === entry.points ? lastRank : index + 1;
      lastPoints = entry.points;
      lastRank = rank;
      return { ...entry, rank };
    });
  }, [profileById, rows, startedMatches, t]);

  const summary = useMemo(() => {
    return {
      players: roundTable.length,
      best: roundTable.length ? roundTable[0].points : 0,
      exact: roundTable.reduce((acc, item) => acc + item.exact, 0),
    };
  }, [roundTable]);

  const myRow = useMemo(
    () => (user ? roundTable.find((item) => item.userId === user.id) : undefined),
    [roundTable, user],
  );

  const shownRows = roundTable.slice(0, visibleRows);
  const isMyRowHidden = !!myRow && !shownRows.some((item) => item.userId === myRow.userId);

  const hasRounds = !!rounds.length && !!table.length;

  const renderRow = (item: IRoundRow, pinned = false) => {
    const isMe = !!user && item.userId === user.id;
    const isMedal = item.rank <= 3 && item.points > 0;

    return (
      <div
        className={cn(styles.row, { [styles.rowMe]: isMe, [styles.rowPinned]: pinned })}
        key={`${pinned ? 'pinned-' : ''}${item.userId}`}>
        <div className={cn(styles.col, styles.colRank)}>
          <span className={cn(styles.rank, { [styles.rankMedal]: isMedal })}>{item.rank}</span>
        </div>
        <div className={cn(styles.col, styles.colName)}>
          <span className={styles.rowAvatar}>
            {item.avatar ? <img src={resolveAssetUrl(item.avatar)} alt={item.name} /> : getUserInitials(item.name)}
          </span>
          <Link
            to={`/profile/${item.userId}?tournamentId=${tournament.id}`}
            className={styles.userLink}
            title={item.name}>
            {item.name}
          </Link>
          {isMe && <span className={styles.meChip}>{t('pages.leagues.me')}</span>}
        </div>
        <div className={styles.col}>{item.predicts}</div>
        <div className={styles.col}>{item.exact}</div>
        <div className={cn(styles.col, styles.colPoints)}>
          <span className={styles.points}>{item.points}</span>
        </div>
      </div>
    );
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.eyebrow}>
            <TrophyIcon />
            {t('pages.leagues.roundPoints.eyebrow')}
          </span>
          <h3 className={styles.panelTitle}>{t('pages.leagues.roundPoints.title')}</h3>
          <p className={styles.panelSubtitle}>{t('pages.leagues.roundPoints.subtitle')}</p>
        </div>

        {!isPending && !!roundTable.length && (
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{summary.best}</span>
              <span className={styles.metricLabel}>{t('pages.leagues.roundPoints.metrics.best')}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{summary.exact}</span>
              <span className={styles.metricLabel}>{t('pages.leagues.roundPoints.metrics.exact')}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{summary.players}</span>
              <span className={styles.metricLabel}>{t('pages.leagues.roundPoints.metrics.players')}</span>
            </div>
          </div>
        )}
      </div>

      {!hasRounds && (
        <div className={styles.tableWrap}>
          <div className={styles.emptyRow}>
            <p className={styles.emptyTitle}>{t('pages.leagues.emptyTitle')}</p>
            <p className={styles.empty}>{t('pages.leagues.emptyText')}</p>
          </div>
        </div>
      )}

      {hasRounds && (
        <>
          <div
            className={styles.roundList}
            role="tablist"
            aria-label={t('pages.leagues.roundPoints.title')}
            ref={roundListRef}>
            {rounds.map((round) => {
              const isActive = round.key === activeRoundKey;

              return (
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={cn(styles.roundChip, { [styles.roundChipActive]: isActive })}
                  key={round.key}
                  ref={isActive ? activeChipRef : undefined}
                  onClick={() => setSelectedRoundKey(round.key)}>
                  {round.label}
                </button>
              );
            })}
          </div>

          {hasStarted && !isRoundFinished && !isPending && !!roundTable.length && (
            <p className={styles.note}>{t('pages.leagues.roundPoints.inProgressText')}</p>
          )}

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
              <div className={cn(styles.col, styles.colPoints)}>
                {isMobile ? t('pages.leagues.table.pointsShort') : t('pages.leagues.table.points')}
              </div>
            </div>

            {isPending && (
              <div className={styles.loading}>
                {Array.from({ length: 6 }, (_, index) => (
                  <span className={styles.loadingRow} key={index} />
                ))}
              </div>
            )}

            {!isPending && shownRows.map((item) => renderRow(item))}

            {!isPending && isMyRowHidden && myRow && renderRow(myRow, true)}

            {!isPending && isError && !roundTable.length && (
              <div className={styles.emptyRow}>
                <p className={styles.emptyTitle}>{t('pages.leagues.roundPoints.errorTitle')}</p>
                <p className={styles.empty}>{t('pages.leagues.roundPoints.errorText')}</p>
              </div>
            )}

            {!isPending && !isError && !roundTable.length && (
              <div className={styles.emptyRow}>
                <p className={styles.emptyTitle}>
                  {hasStarted
                    ? t('pages.leagues.roundPoints.emptyTitle')
                    : t('pages.leagues.roundPoints.notPlayedTitle')}
                </p>
                <p className={styles.empty}>
                  {hasStarted ? t('pages.leagues.roundPoints.emptyText') : t('pages.leagues.roundPoints.notPlayedText')}
                </p>
              </div>
            )}
          </div>

          {!isPending && visibleRows < roundTable.length && (
            <div className={styles.moreWrap}>
              <button
                type="button"
                className={styles.moreButton}
                onClick={() => setVisibleRows((prev) => prev + PAGE_SIZE)}>
                {t('pages.leagues.showMore', undefined, {
                  count: Math.min(PAGE_SIZE, roundTable.length - visibleRows),
                })}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default RoundPoints;
