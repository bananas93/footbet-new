import styles from './Rules.module.scss';

const Rules: React.FC = () => {
  return (
    <div className={styles.rules}>
      <h1 className={styles.rulesTitle}>Правила</h1>
      <div className={styles.rulesCard}>
        <h5 className={styles.rulesCardTitle}>Нарахування очок</h5>
        <ol>
          <li>Вгаданий переможець матчу – 2 очки</li>
          <li>Вгаданий переможець + вгадана різниця – 3 очки</li>
          <li>Вгаданий точний рахунок – 5 очок</li>
          <li>Вгаданий точний рахунок + в матчі забито 5+ голів – 6 очок</li>
        </ol>
        <i className={styles.rulesCardNote}>
          Результат визначається наприкінці гри, тобто через 90 хвилин або через 120 хвилин якщо матч закінчується
          додатковим часом. Матчі, які завершились серією пенальті, зараховуються як нічия.
        </i>
      </div>
      <div>
        <h5 className={styles.rulesCardTitle}>При одинаковій кількості очок, позиції учасників визначаються</h5>
        <ol>
          <li>Кількість точних прогнозів</li>
          <li>Кількість вгаданих результатів</li>
          <li>Кількість вгаданих різниць рахунку</li>
          <li>Кількість вгаданих 5+ рахунків</li>
          <li>Менша кількість прогнозів</li>
        </ol>
      </div>
    </div>
  );
};

export default Rules;
