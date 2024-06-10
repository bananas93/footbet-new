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
            <div className={cn(styles.tableCol, styles.head, styles.hidden)}>Рахунки (x5)</div>
            <div className={cn(styles.tableCol, styles.head, styles.hidden)}>Результати (x2)</div>
            <div className={cn(styles.tableCol, styles.head, styles.hidden)}>Різниці (x1)</div>
            <div className={cn(styles.tableCol, styles.head, styles.hidden)}>5+ голів (x1)</div>
            <div className={cn(styles.tableCol, styles.head)}>Очки</div>
          </div>
          {table.map((item) => (
            <div className={styles.table} key={item.id}>
              <div className={styles.tableCol}>
                <strong>{item.name}</strong>
              </div>
              <div className={cn(styles.tableCol, styles.hidden)}>{item.correctScore}</div>
              <div className={cn(styles.tableCol, styles.hidden)}>{item.correctResult}</div>
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
