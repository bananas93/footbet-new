import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { notify, readLocalCache, supabase, writeLocalCache } from 'helpers';
import { useAppSelector } from 'store';
import styles from './MatchDetails.module.scss';

type MatchDetailsResponse = {
  hasExternalData: boolean;
  message?: string;
  localMatch?: any;
  external?: {
    fixture?: any;
    lineups?: any;
    statistics?: any;
    events?: any;
  };
};

type MatchDetailsCacheEntry = {
  payload: MatchDetailsResponse;
  cachedAt: number;
};

const MATCH_LOCAL_CACHE_TTL_SECONDS = 20;

const MatchDetails: React.FC = () => {
  const { tournamentId, matchId } = useParams<{ tournamentId: string; matchId: string }>();
  const matchesByTournament = useAppSelector((state) => state.match.matches);
  const [data, setData] = useState<MatchDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const currentMatch = useMemo(() => {
    if (!tournamentId || !matchId) {
      return null;
    }

    const grouped = matchesByTournament[Number(tournamentId)] || [];
    return grouped.flatMap((group) => group.data || []).find((item) => item.id === Number(matchId)) || null;
  }, [matchId, matchesByTournament, tournamentId]);

  const fixtureId = currentMatch?.apiFixtureId;

  const fetchDetails = async (silent = false, forceRefresh = false) => {
    if (!fixtureId) {
      if (!silent) {
        setIsLoading(false);
      }
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }

    try {
      const cacheKey = `football-details:match:${fixtureId}`;

      if (!forceRefresh) {
        const cached = readLocalCache<MatchDetailsCacheEntry>(cacheKey);
        if (cached) {
          setData(cached.payload);
          setLastUpdated(new Date(cached.cachedAt));
          return;
        }
      }

      const { data: json, error } = await supabase.functions.invoke('football-details', {
        body: {
          type: 'match',
          fixtureId,
          forceRefresh,
        },
      });

      if (error) {
        throw new Error(error.message || 'Не вдалося отримати деталі матчу');
      }

      const resolvedData = json as MatchDetailsResponse;
      const cachedAt = Date.now();
      setData(resolvedData);
      setLastUpdated(new Date(cachedAt));
      writeLocalCache<MatchDetailsCacheEntry>(
        cacheKey,
        {
          payload: resolvedData,
          cachedAt,
        },
        MATCH_LOCAL_CACHE_TTL_SECONDS,
      );
    } catch (error: any) {
      notify.error(error.message || 'Не вдалося отримати деталі матчу');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchDetails();
  }, [fixtureId]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchDetails(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fixtureId]);

  const fixtureResponse = useMemo(() => data?.external?.fixture?.response || [], [data]);
  const fixture = fixtureResponse?.[0] || null;

  if (isLoading) {
    return <div className={styles.placeholder}>Завантаження деталей матчу...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link to={`/tournament/${tournamentId}`} className={styles.backLink}>
          ← До матчів
        </Link>
        <button type="button" className={styles.refreshButton} onClick={() => void fetchDetails(false, true)}>
          Оновити
        </button>
      </div>

      <h2 className={styles.title}>Деталі матчу</h2>
      {lastUpdated && <p className={styles.meta}>Оновлено: {lastUpdated.toLocaleTimeString('uk-UA')}</p>}

      {!fixtureId && (
        <div className={styles.card}>
          <p>Для цього матчу ще не заповнено api_fixture_id в базі даних.</p>
        </div>
      )}

      {!data?.hasExternalData && (
        <div className={styles.card}>
          <p>{data?.message || 'Для цього матчу ще не привʼязано apiFixtureId.'}</p>
        </div>
      )}

      {fixture && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            {fixture.teams?.home?.name} {fixture.goals?.home ?? '-'}:{fixture.goals?.away ?? '-'} {fixture.teams?.away?.name}
          </h3>
          <p className={styles.meta}>Статус: {fixture.fixture?.status?.long || fixture.fixture?.status?.short}</p>
          <p className={styles.meta}>Стадіон: {fixture.fixture?.venue?.name || '—'}</p>
          <p className={styles.meta}>Ліга: {fixture.league?.name || '—'}</p>
        </div>
      )}

      {data?.external?.lineups && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Склади</h3>
          <pre className={styles.json}>{JSON.stringify(data.external.lineups.response || [], null, 2)}</pre>
        </div>
      )}

      {data?.external?.statistics && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Статистика</h3>
          <pre className={styles.json}>{JSON.stringify(data.external.statistics.response || [], null, 2)}</pre>
        </div>
      )}

      {data?.external?.events && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Події матчу</h3>
          <pre className={styles.json}>{JSON.stringify(data.external.events.response || [], null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default MatchDetails;
