import { useCallback, useEffect } from 'react';
import { Outlet, useOutletContext, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'store';
import { getMatches } from 'store/slices/match';
import { getTournamentStandings } from 'store/slices/tournament';
import { NavLink } from 'react-router-dom';
import styles from './Tournament.module.scss';
import { ITournament } from 'interfaces';
import { getPredictsTable } from 'store/slices/predict';
import Skeleton from 'react-loading-skeleton';
import { notify, playNotification, resolveAssetUrl, supabase } from 'helpers';

type ContextType = {
  tournament: ITournament;
};

const Tournament: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tournament = useAppSelector((state) => state.tournament.tournaments.find((t) => t.id === Number(tournamentId)));
  const { isLoading } = useAppSelector((state) => state.match.getMatchesRequest);

  const getStandings = useCallback(async () => {
    await Promise.all([
      dispatch(getTournamentStandings(Number(tournamentId))),
      dispatch(getMatches({ tournamentId: Number(tournamentId), _background: true })),
      dispatch(getPredictsTable(Number(tournamentId))),
    ]);
  }, [dispatch, tournamentId]);

  useEffect(() => {
    getStandings();
  }, [getStandings]);

  useEffect(() => {
    document.title = `${tournament?.name} | Tournament`;
    return () => {
      document.title = 'Турнір прогнозистів | Footbet';
    };
  }, [tournament?.name]);

  useEffect(() => {
    if (!tournamentId) {
      return;
    }

    const tournamentIdNumber = Number(tournamentId);
    const channel = supabase
      .channel(`tournament-matches-${tournamentIdNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentIdNumber}`,
        },
        async (payload) => {
          const updatedMatchId = payload.new.id as number;
          const { data: updatedMatch } = await supabase
            .from('matches')
            .select(
              `
                home_score,
                away_score,
                homeTeam:teams!matches_home_team_id_fkey(name),
                awayTeam:teams!matches_away_team_id_fkey(name)
              `,
            )
            .eq('id', updatedMatchId)
            .maybeSingle();

          if (!updatedMatch) {
            playNotification();
            notify.success('Матч оновлено', 5000);
            getStandings();
            return;
          }

          const matchData: any = updatedMatch;

          const homeTeamName = Array.isArray(matchData.homeTeam)
            ? matchData.homeTeam[0]?.name
            : matchData.homeTeam?.name;
          const awayTeamName = Array.isArray(matchData.awayTeam)
            ? matchData.awayTeam[0]?.name
            : matchData.awayTeam?.name;

          playNotification();
          if (homeTeamName && awayTeamName) {
            notify.success(
              `${homeTeamName} ${updatedMatch.home_score}-${updatedMatch.away_score} ${awayTeamName}`,
              5000,
            );
          } else {
            notify.success('Матч оновлено', 5000);
          }

          getStandings();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [getStandings, tournamentId]);

  return (
    <div className={styles.tournament}>
      <header className={styles.tournamentHeader}>
        <div className={styles.tournamentHead}>
          <div className={styles.tournamentLogo}>
            {!tournament?.logo ? <Skeleton /> : <img src={resolveAssetUrl(tournament?.logo)} alt={tournament?.name} />}
          </div>
          <h1 className={styles.tournamentName}>{tournament?.name}</h1>
        </div>
        <nav className={styles.tournamentNav}>
          <ul className={styles.tournamentNavList}>
            <li className={styles.tournamentNavListItem}>
              <NavLink
                className={({ isActive }) => (isActive ? styles.active : '')}
                to={`/tournament/${tournament?.id}`}
                end>
                Прогнози
              </NavLink>
            </li>
            {tournament?.hasTable && (
              <li className={styles.tournamentNavListItem}>
                <NavLink
                  className={({ isActive }) => (isActive ? styles.active : '')}
                  to={`/tournament/${tournament.id}/standings`}>
                  Турнірна таблиця
                </NavLink>
              </li>
            )}
            <li className={styles.tournamentNavListItem}>
              <NavLink
                className={({ isActive }) => (isActive ? styles.active : '')}
                to={`/tournament/${tournament?.id}/leagues`}>
                Загальна ліга
              </NavLink>
            </li>
            <li className={styles.tournamentNavListItem}>
              <NavLink
                className={({ isActive }) => (isActive ? styles.active : '')}
                to={`/tournament/${tournament?.id}/rooms`}>
                Кімнати
              </NavLink>
            </li>
            <li className={styles.tournamentNavListItem}>
              <NavLink
                className={({ isActive }) => (isActive ? styles.active : '')}
                to={`/tournament/${tournament?.id}/achievements`}>
                Досягнення
              </NavLink>
            </li>
          </ul>
        </nav>
        <div
          className={styles.tournamentOverlay}
          style={{ backgroundImage: `url(${resolveAssetUrl(tournament?.logo)})` }}
        />
      </header>
      {isLoading || !tournament ? (
        <div className={styles.tournamentHeader}>
          <Skeleton height={300} />
        </div>
      ) : (
        <Outlet context={{ tournament } satisfies ContextType} />
      )}
    </div>
  );
};

export function useTournament() {
  return useOutletContext<ContextType>();
}

export default Tournament;
