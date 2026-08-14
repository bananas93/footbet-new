import { useEffect, useMemo } from 'react';
import cn from 'classnames';
import { Link } from 'react-router-dom';
import { Modal } from 'components';
import { IMatch, MatchStatus } from 'interfaces';
import { getUserInitials, resolveAssetUrl } from 'helpers';
import { useAppDispatch, useAppSelector } from 'store';
import { getMatchPredicts } from 'store/slices/predict';
import styles from './ShowPredicts.module.scss';

interface Props {
  match: IMatch;
  isOpen: boolean;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  [MatchStatus.SCHEDULED]: 'Заплановано',
  [MatchStatus.IN_PROGRESS]: 'Live',
  [MatchStatus.FINISHED]: 'Завершено',
  [MatchStatus.POSTPONED]: 'Перенесено',
};

const getPointsTone = (points: number) => {
  if (points >= 6) {
    return 'orange';
  }

  if (points >= 5) {
    return 'gold';
  }

  if (points >= 3) {
    return 'teal';
  }

  if (points >= 2) {
    return 'blue';
  }

  return 'neutral';
};

const ShowPredicts: React.FC<Props> = ({ match, isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { isLoading, data } = useAppSelector((state) => state.predict.getMatchPredictsRequest);
  const user = useAppSelector((state) => state.user.user);
  const title = `Прогнози ${match.homeTeam.name} vs ${match.awayTeam.name}`;

  const isScheduled = match.status === MatchStatus.SCHEDULED;
  const isLive = match.status === MatchStatus.IN_PROGRESS;

  useEffect(() => {
    const getPredicts = async () => {
      await dispatch(getMatchPredicts(match.id)).unwrap();
    };

    getPredicts();
  }, [dispatch, match.id]);

  const summary = useMemo(() => {
    const predicts = data || [];
    return {
      total: predicts.length,
      best: predicts.reduce((acc, item) => Math.max(acc, item.points || 0), 0),
      exact: predicts.filter((item) => item.homeScore === match.homeScore && item.awayScore === match.awayScore).length,
    };
  }, [data, match.awayScore, match.homeScore]);

  const renderTeam = (team: IMatch['homeTeam']) => (
    <div className={styles.team}>
      <span className={styles.teamLogo}>
        {team.logo ? <img src={resolveAssetUrl(team.logo)} alt={team.name} /> : <span>{getUserInitials(team.name)}</span>}
      </span>
      <span className={styles.teamName} title={team.name}>
        {team.name}
      </span>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className={styles.scoreboard}>
        <div className={styles.scoreboardGlow} aria-hidden />

        <div className={styles.scoreboardTop}>
          <span className={cn(styles.statusChip, { [styles.statusLive]: isLive })}>
            {isLive && <span className={styles.liveDot} />}
            {statusLabels[match.status] || match.status}
          </span>
        </div>

        <div className={styles.scoreboardRow}>
          {renderTeam(match.homeTeam)}

          <div className={styles.score}>
            {isScheduled ? (
              <span className={styles.scoreVs}>vs</span>
            ) : (
              <>
                <span className={styles.scoreValue}>{match.homeScore}</span>
                <span className={styles.scoreDash}>:</span>
                <span className={styles.scoreValue}>{match.awayScore}</span>
              </>
            )}
          </div>

          {renderTeam(match.awayTeam)}
        </div>
      </div>

      {!isLoading && !!summary.total && (
        <div className={styles.chips}>
          <span className={styles.chip}>Прогнозів: {summary.total}</span>
          {!isScheduled && <span className={styles.chip}>Точних: {summary.exact}</span>}
          {!isScheduled && <span className={styles.chip}>Максимум: {summary.best} очк.</span>}
        </div>
      )}

      <div className={styles.tableWrap}>
        <div className={cn(styles.row, styles.headRow)}>
          <div className={cn(styles.col, styles.colName)}>Гравець</div>
          <div className={styles.col}>Прогноз</div>
          <div className={cn(styles.col, styles.colPoints)}>Очки</div>
        </div>

        {isLoading && (
          <div className={styles.loading}>
            {Array.from({ length: 6 }, (_, index) => (
              <span className={styles.loadingRow} key={index} />
            ))}
          </div>
        )}

        {!isLoading &&
          data?.map((item) => {
            const isMe = !!user && item.user?.id === user.id;
            const tone = getPointsTone(item.points || 0);

            return (
              <div className={cn(styles.row, { [styles.rowMe]: isMe })} key={item.id}>
                <div className={cn(styles.col, styles.colName)}>
                  <span className={styles.avatar}>
                    {item.user?.avatar ? (
                      <img src={resolveAssetUrl(item.user.avatar)} alt={item.user?.name || 'User avatar'} />
                    ) : (
                      getUserInitials(item.user?.name)
                    )}
                  </span>
                  {item.user?.id ? (
                    <Link
                      to={`/profile/${item.user.id}?tournamentId=${match.tournamentId}`}
                      className={styles.userLink}
                      title={item.user.name}>
                      {item.user.name || 'Unknown user'}
                    </Link>
                  ) : (
                    <span className={styles.userName}>{item.user?.name || 'Unknown user'}</span>
                  )}
                  {isMe && <span className={styles.meChip}>Ви</span>}
                </div>
                <div className={styles.col}>
                  <span className={styles.predict}>
                    {item.homeScore} : {item.awayScore}
                  </span>
                </div>
                <div className={cn(styles.col, styles.colPoints)}>
                  <span className={cn(styles.points, styles[tone])}>{item.points}</span>
                </div>
              </div>
            );
          })}

        {!isLoading && !data?.length && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Прогнозів немає</p>
            <p className={styles.emptyText}>Ніхто ще не зробив прогноз на цей матч.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShowPredicts;
