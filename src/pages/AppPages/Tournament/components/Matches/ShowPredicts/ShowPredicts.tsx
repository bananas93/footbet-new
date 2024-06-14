import cn from 'classnames';
import { Modal } from 'components';
import { IMatch } from 'interfaces';
import { useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useAppDispatch, useAppSelector } from 'store';
import { getMatchPredicts } from 'store/slices/predict';
import styles from './ShowPredicts.module.scss';

interface Props {
  match: IMatch;
  isOpen: boolean;
  onClose: () => void;
}

const ShowPredicts: React.FC<Props> = ({ match, isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { isLoading, data } = useAppSelector((state) => state.predict.getMatchPredictsRequest);
  const title = `Прогнози ${match.homeTeam.name} vs ${match.awayTeam.name}`;

  useEffect(() => {
    const getPredicts = async () => {
      await dispatch(getMatchPredicts(match.id)).unwrap();
    };

    getPredicts();
  }, [dispatch, match.id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className={styles.result}>
        Результат:{' '}
        <strong>
          {match.homeScore} - {match.awayScore}
        </strong>
      </div>
      {isLoading ? (
        <div>
          <Skeleton count={5} />
        </div>
      ) : (
        <div>
          <div className={styles.table}>
            <div className={cn(styles.tableCol, styles.head)}>Ім'я</div>
            <div className={cn(styles.tableCol, styles.head)}>Прогноз</div>
            <div className={cn(styles.tableCol, styles.head)}>Очки</div>
          </div>
          {data?.map((item) => (
            <div className={styles.table} key={item.id}>
              <div className={styles.tableCol}>
                <strong>{item.user.name}</strong>
              </div>
              <div className={styles.tableCol}>
                {item.homeScore} - {item.awayScore}
              </div>
              <div className={styles.tableCol}>{item.points}</div>
            </div>
          )) || (
            <div className={styles.table}>
              <div className={styles.tableCol}>Прогнозів немає</div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ShowPredicts;
