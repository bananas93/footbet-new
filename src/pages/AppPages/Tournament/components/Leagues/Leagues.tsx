import { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { Button, Card, TextInput } from 'components';
import { useAppSelector } from 'store';
import { Link } from 'react-router-dom';
import { useTournament } from '../../Tournament';
import styles from './Leagues.module.scss';

const Leagues: React.FC = () => {
  const { tournament } = useTournament();
  const globalTable = useAppSelector((state) => state.predict.table)[tournament.id] || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [visibleRows, setVisibleRows] = useState(25);
  const table = globalTable;

  const filteredTable = useMemo(() => {
    return table.filter((row) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesName = query ? row.name.toLowerCase().includes(query) : true;
      const matchesActive = onlyActive ? row.totalMatches > 0 || row.points > 0 : true;
      return matchesName && matchesActive;
    });
  }, [onlyActive, searchQuery, table]);

  const shownTable = useMemo(() => filteredTable.slice(0, visibleRows), [filteredTable, visibleRows]);

  useEffect(() => {
    setVisibleRows(25);
  }, [searchQuery, onlyActive]);

  return (
    <div className={styles.container}>
      <section className={styles.leagueSection}>
        <Card title="Загальна ліга">
          <div className={styles.toolbar}>
            <TextInput
              name="searchUser"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук по імені"
            />
            <Button variant={onlyActive ? 'primary' : 'secondary'} onClick={() => setOnlyActive((prev) => !prev)}>
              {onlyActive ? 'Показати всіх' : 'Тільки активні'}
            </Button>
          </div>

          <p className={styles.counter}>
            Показано: {shownTable.length} з {filteredTable.length}
          </p>

          <div className={styles.tableWrap}>
            <div className={styles.table}>
              <div className={cn(styles.tableCol, styles.head)}>#</div>
              <div className={cn(styles.tableCol, styles.head)}>Ім'я</div>
              <div className={cn(styles.tableCol, styles.head)}>Матчів</div>
              <div className={cn(styles.tableCol, styles.head)}>Точні</div>
              <div className={cn(styles.tableCol, styles.head)}>Результат</div>
              <div className={cn(styles.tableCol, styles.head, styles.hidden)}>Різниці</div>
              <div className={cn(styles.tableCol, styles.head, styles.hidden)}>5+ голів</div>
              <div className={cn(styles.tableCol, styles.head)}>Очки</div>
            </div>
            {shownTable.map((item, index) => (
              <div className={styles.table} key={item.id}>
                <div className={styles.tableCol}>{index + 1}</div>
                <div className={styles.tableCol}>
                  <Link to={`/tournament/${tournament.id}/achievements?userId=${item.id}`} className={styles.userLink}>
                    {item.name}
                  </Link>
                </div>
                <div className={styles.tableCol}>{item.totalMatches}</div>
                <div className={styles.tableCol}>{item.correctScore}</div>
                <div className={styles.tableCol}>{item.correctResult}</div>
                <div className={cn(styles.tableCol, styles.hidden)}>{item.correctDifference}</div>
                <div className={cn(styles.tableCol, styles.hidden)}>{item.fivePlusGoals}</div>
                <div className={styles.tableCol}>{item.points}</div>
              </div>
            ))}
          </div>

          {!shownTable.length && <p className={styles.empty}>Поки немає даних для таблиці.</p>}

          {visibleRows < filteredTable.length && (
            <div className={styles.moreWrap}>
              <Button variant="secondary" onClick={() => setVisibleRows((prev) => prev + 25)}>
                Показати ще 25
              </Button>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};

export default Leagues;
