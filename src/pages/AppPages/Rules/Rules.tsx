import cn from 'classnames';
import styles from './Rules.module.scss';

type ScoringRule = {
  points: number;
  unit: string;
  label: string;
  title: string;
  tone: 'blue' | 'teal' | 'gold' | 'orange';
};

const scoringRules: ScoringRule[] = [
  {
    points: 2,
    unit: 'очки',
    label: 'Базовий результат',
    title: 'Вгаданий переможець матчу',
    tone: 'blue',
  },
  {
    points: 3,
    unit: 'очки',
    label: 'Точна різниця',
    title: 'Вгаданий переможець і вгадана різниця мʼячів',
    tone: 'teal',
  },
  {
    points: 5,
    unit: 'очок',
    label: 'Ідеальний прогноз',
    title: 'Вгаданий точний рахунок',
    tone: 'gold',
  },
  {
    points: 6,
    unit: 'очок',
    label: 'Максимум за матч',
    title: 'Вгаданий точний рахунок у матчі з 5+ голами',
    tone: 'orange',
  },
];

const tiebreakRules = [
  'Кількість точних прогнозів',
  'Кількість вгаданих результатів',
  'Кількість вгаданих різниць рахунку',
  'Кількість вгаданих 5+ рахунків',
  'Менша кількість прогнозів',
];

const iconProps = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const BookIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2.5 2.5 0 0 1 2 1v13a2.5 2.5 0 0 0-2-1H5.5A1.5 1.5 0 0 1 4 15.5v-10Z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2.5 2.5 0 0 0-2 1v13a2.5 2.5 0 0 1 2-1h4.5a1.5 1.5 0 0 0 1.5-1.5v-10Z" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const Rules: React.FC = () => {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>
            <BookIcon className={styles.heroEyebrowIcon} />
            Довідка
          </span>
          <h1 className={styles.heroTitle}>Правила</h1>
          <p className={styles.heroSubtitle}>
            Як нараховуються очки за прогнози та за якими критеріями визначаються позиції в таблиці
          </p>
        </div>
      </section>

      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Нарахування очок</h2>
        <span className={styles.sectionMeta}>{scoringRules.length} варіанти</span>
      </div>

      <div className={styles.grid}>
        {scoringRules.map((rule, index) => (
          <article
            className={cn(styles.card, styles[rule.tone])}
            key={rule.points}
            style={{ '--i': index } as React.CSSProperties}>
            <div className={styles.cardGlow} aria-hidden />
            <p className={styles.cardPoints}>
              {rule.points}
              <span className={styles.cardUnit}>{rule.unit}</span>
            </p>
            <span className={styles.cardLabel}>{rule.label}</span>
            <h3 className={styles.cardTitle}>{rule.title}</h3>
          </article>
        ))}
      </div>

      <div className={styles.note}>
        <span className={styles.noteIcon}>
          <InfoIcon />
        </span>
        <p className={styles.noteText}>
          Результат визначається наприкінці гри, тобто через 90 хвилин або через 120 хвилин якщо матч закінчується
          додатковим часом. Матчі, які завершились серією пенальті, зараховуються як нічия.
        </p>
      </div>

      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>При однаковій кількості очок</h2>
        <span className={styles.sectionMeta}>Порядок критеріїв</span>
      </div>

      <ol className={styles.steps}>
        {tiebreakRules.map((rule, index) => (
          <li className={styles.step} key={rule} style={{ '--i': index } as React.CSSProperties}>
            <span className={styles.stepIndex}>{index + 1}</span>
            <p className={styles.stepText}>{rule}</p>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Rules;
