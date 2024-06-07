import { useEffect } from 'react';
import { Outlet, useOutletContext, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'store';
import { getMatches } from 'store/slices/match';
import { getTournamentStandings } from 'store/slices/tournament';
import { NavLink } from 'react-router-dom';
import styles from './Tournament.module.scss';
import { ITournament } from 'interfaces';
import { getPredictsTable } from 'store/slices/predict';

type ContextType = {
  tournament: ITournament;
};

const Tournament: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tournament = useAppSelector((state) => state.tournament.tournaments.find((t) => t.id === Number(tournamentId)));
  const { isLoading } = useAppSelector((state) => state.match.getMatchesRequest);

  useEffect(() => {
    document.title = `${tournament?.name} | Tournament`;
    const getStandings = async () => {
      await Promise.all([
        dispatch(getTournamentStandings(Number(tournamentId))),
        dispatch(getMatches({ tournamentId: Number(tournamentId) })),
        dispatch(getPredictsTable(Number(tournamentId))),
      ]);
    };
    getStandings();
  }, [dispatch, tournament?.name, tournamentId]);

  if (!tournament) {
    return <div>Tournament not found</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.tournament}>
      <header className={styles.tournamentHeader}>
        <div className={styles.tournamentHead}>
          <div className={styles.tournamentLogo}>
            <img src={`http://localhost:3000/uploads/${tournament.logo}`} alt={tournament.name} />
          </div>
          <h1 className={styles.tournamentName}>{tournament?.name}</h1>
        </div>
        <nav className={styles.tournamentNav}>
          <ul className={styles.tournamentNavList}>
            <li className={styles.tournamentNavListItem}>
              <NavLink
                className={({ isActive }) => (isActive ? styles.active : '')}
                to={`/tournament/${tournament.id}`}
                end>
                Прогнози
              </NavLink>
            </li>
            <li className={styles.tournamentNavListItem}>
              <NavLink
                className={({ isActive }) => (isActive ? styles.active : '')}
                to={`/tournament/${tournament.id}/standings`}>
                Турнірна таблиця
              </NavLink>
            </li>
            <li className={styles.tournamentNavListItem}>
              <NavLink
                className={({ isActive }) => (isActive ? styles.active : '')}
                to={`/tournament/${tournament.id}/leagues`}>
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
          style={{ backgroundImage: `url(http://localhost:3000/uploads/${tournament.logo})` }}
        />
      </header>
      <Outlet context={{ tournament } satisfies ContextType} />
    </div>
  );
};

export function useTournament() {
  return useOutletContext<ContextType>();
}

export default Tournament;
