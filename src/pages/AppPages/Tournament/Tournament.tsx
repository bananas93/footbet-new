import { useCallback, useEffect, useMemo } from 'react';
import cn from 'classnames';
import { NavLink, Outlet, useOutletContext, useParams } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import { useAppDispatch, useAppSelector } from 'store';
import { getMatches } from 'store/slices/match';
import { getTournamentStandings } from 'store/slices/tournament';
import { getPredictsTable } from 'store/slices/predict';
import { ITournament, TournamentStatus } from 'interfaces';
import { notify, playNotification, resolveAssetUrl, supabase } from 'helpers';
import styles from './Tournament.module.scss';

type ContextType = {
  tournament: ITournament;
};

const statusLabels: Record<TournamentStatus, string> = {
  scheduled: 'Заплановано',
  live: 'Live',
  completed: 'Завершено',
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

  const navItems = useMemo(() => {
    if (!tournament) {
      return [];
    }

    return [
      { to: `/tournament/${tournament.id}`, label: 'Прогнози', end: true },
      ...(tournament.hasTable ? [{ to: `/tournament/${tournament.id}/standings`, label: 'Турнірна таблиця' }] : []),
      { to: `/tournament/${tournament.id}/leagues`, label: 'Загальна ліга' },
      { to: `/tournament/${tournament.id}/rooms`, label: 'Кімнати' },
      { to: `/tournament/${tournament.id}/achievements`, label: 'Досягнення' },
    ];
  }, [tournament]);

  const logoUrl = tournament?.logo ? resolveAssetUrl(tournament.logo) : '';

  return (
    <div className={styles.tournament}>
      <header className={styles.header}>
        {!!logoUrl && <div className={styles.backdrop} style={{ backgroundImage: `url(${logoUrl})` }} aria-hidden />}
        <div className={styles.veil} aria-hidden />
        <div className={styles.glow} aria-hidden />

        <div className={styles.headerInner}>
          <div className={styles.identity}>
            <div className={styles.logo}>
              {logoUrl ? (
                <img src={logoUrl} alt={tournament?.name} />
              ) : (
                <Skeleton height="100%" containerClassName={styles.logoSkeleton} />
              )}
            </div>

            <div className={styles.identityText}>
              <div className={styles.badges}>
                {tournament?.status && (
                  <span className={cn(styles.statusBadge, styles[tournament.status])}>
                    <span className={styles.statusDot} />
                    {statusLabels[tournament.status]}
                  </span>
                )}
                {!!tournament && (
                  <span className={styles.metaBadge}>
                    {tournament.type === 'national' ? 'Національний' : 'Клубний'}
                  </span>
                )}
                {!!tournament && tournament.groupNumber > 1 && (
                  <span className={styles.metaBadge}>Груп: {tournament.groupNumber}</span>
                )}
                {!!tournament && tournament.knockoutRound > 0 && (
                  <span className={styles.metaBadge}>Плей-оф: {tournament.knockoutRound}</span>
                )}
              </div>

              <h1 className={styles.name}>
                {tournament?.name || (
                  <Skeleton
                    width="60%"
                    height="2rem"
                    baseColor="rgba(255, 255, 255, 0.14)"
                    highlightColor="rgba(255, 255, 255, 0.26)"
                  />
                )}
              </h1>
            </div>
          </div>

          <nav className={styles.nav}>
            {!!navItems.length && (
              <ul className={styles.navList}>
                {navItems.map((item) => (
                  <li className={styles.navItem} key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => cn(styles.navLink, { [styles.active]: isActive })}>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}

            {!navItems.length && (
              <ul className={styles.navList}>
                {Array.from({ length: 4 }, (_, index) => (
                  <li className={styles.navItem} key={index}>
                    <span className={styles.navSkeleton} />
                  </li>
                ))}
              </ul>
            )}
          </nav>
        </div>
      </header>

      {isLoading || !tournament ? (
        <div className={styles.contentSkeleton}>
          <span className={cn(styles.skeletonBlock, styles.skeletonHero)} />
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 6 }, (_, index) => (
              <span className={styles.skeletonBlock} key={index} />
            ))}
          </div>
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
