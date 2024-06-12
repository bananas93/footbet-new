import { useEffect } from 'react';
import { Outlet, useOutletContext, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'store';
import { getMatches } from 'store/slices/match';
import { getTournamentStandings } from 'store/slices/tournament';
import { NavLink } from 'react-router-dom';
import styles from './Tournament.module.scss';
import { ITournament } from 'interfaces';
import { getPredictsTable } from 'store/slices/predict';
import Skeleton from 'react-loading-skeleton';

type ContextType = {
  tournament: ITournament;
};

const Tournament: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tournament = useAppSelector((state) => state.tournament.tournaments.find((t) => t.id === Number(tournamentId)));
  const { isLoading } = useAppSelector((state) => state.match.getMatchesRequest);

  useEffect(() => {
    const getStandings = async () => {
      await Promise.all([
        dispatch(getTournamentStandings(Number(tournamentId))),
        dispatch(getMatches({ tournamentId: Number(tournamentId), _background: true })),
        dispatch(getPredictsTable(Number(tournamentId))),
      ]);
    };
    getStandings();
  }, [dispatch, tournament?.name, tournamentId]);

  useEffect(() => {
    document.title = `${tournament?.name} | Tournament`;
    return () => {
      document.title = 'Турнір прогнозистів | Footbet';
    };
  }, [tournament?.name]);

  return (
    <div className={styles.tournament}>
      <header className={styles.tournamentHeader}>
        <div className={styles.tournamentHead}>
          <div className={styles.tournamentLogo}>
            {!tournament?.logo ? (
              <Skeleton />
            ) : (
              <img src={`${process.env.REACT_APP_UPLOAD_URL}/${tournament?.logo}`} alt={tournament?.name} />
            )}
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
                Ліги
              </NavLink>
            </li>
            {/* <li className={styles.tournamentNavListItem}>
              <NavLink
                className={({ isActive }) => (isActive ? styles.active : '')}
                to={`/tournament/${tournament.id}/achievements`}>
                Досягнення
              </NavLink>
            </li> */}
          </ul>
        </nav>
        <div
          className={styles.tournamentOverlay}
          style={{ backgroundImage: `url(${process.env.REACT_APP_UPLOAD_URL}/${tournament?.logo})` }}
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
