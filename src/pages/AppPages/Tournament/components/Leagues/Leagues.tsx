import cn from 'classnames';
import { useAppSelector } from 'store';
import { useTournament } from '../../Tournament';
import { Card } from 'components';
import styles from './Leagues.module.scss';

const Leagues: React.FC = () => {
  const { tournament } = useTournament();
  const table = useAppSelector((state) => state.predict.table)[tournament.id] || [];

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <Card title="Загальна таблиця">
          <div className={styles.table}>
            <div className={cn(styles.tableCol, styles.head)}>Ім'я</div>
            <div className={cn(styles.tableCol, styles.head)}>Точні</div>
            <div className={cn(styles.tableCol, styles.head)}>Результат</div>
            <div className={cn(styles.tableCol, styles.head, styles.hidden)}>Різниці</div>
            <div className={cn(styles.tableCol, styles.head, styles.hidden)}>5+ голів</div>
            <div className={cn(styles.tableCol, styles.head)}>Очки</div>
          </div>
          {table.map((item) => (
            <div className={styles.table} key={item.id}>
              <div className={styles.tableCol}>{item.name}</div>
              <div className={cn(styles.tableCol)}>{item.correctScore}</div>
              <div className={cn(styles.tableCol)}>{item.correctResult}</div>
              <div className={cn(styles.tableCol, styles.hidden)}>{item.correctDifference}</div>
              <div className={cn(styles.tableCol, styles.hidden)}>{item.fivePlusGoals}</div>
              <div className={cn(styles.tableCol)}>{item.points}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

export default Leagues;
