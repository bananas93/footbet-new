import { useMemo } from 'react';
import cn from 'classnames';
import styles from './Rules.module.scss';
import { useI18n } from 'i18n';

type ScoringRule = {
  points: number;
  unit: string;
  label: string;
  title: string;
  tone: 'blue' | 'teal' | 'gold' | 'orange';
};

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
  const { t } = useI18n();

  const scoringRules: ScoringRule[] = useMemo(
    () => [
      {
        points: 2,
        unit: t('pages.rules.scoring.base.unit'),
        label: t('pages.rules.scoring.base.label'),
        title: t('pages.rules.scoring.base.title'),
        tone: 'blue',
      },
      {
        points: 3,
        unit: t('pages.rules.scoring.difference.unit'),
        label: t('pages.rules.scoring.difference.label'),
        title: t('pages.rules.scoring.difference.title'),
        tone: 'teal',
      },
      {
        points: 5,
        unit: t('pages.rules.scoring.perfect.unit'),
        label: t('pages.rules.scoring.perfect.label'),
        title: t('pages.rules.scoring.perfect.title'),
        tone: 'gold',
      },
      {
        points: 6,
        unit: t('pages.rules.scoring.max.unit'),
        label: t('pages.rules.scoring.max.label'),
        title: t('pages.rules.scoring.max.title'),
        tone: 'orange',
      },
    ],
    [t],
  );

  const tiebreakRules = useMemo(
    () => [
      t('pages.rules.tiebreak.one'),
      t('pages.rules.tiebreak.two'),
      t('pages.rules.tiebreak.three'),
      t('pages.rules.tiebreak.four'),
      t('pages.rules.tiebreak.five'),
    ],
    [t],
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>
            <BookIcon className={styles.heroEyebrowIcon} />
            {t('pages.rules.eyebrow')}
          </span>
          <h1 className={styles.heroTitle}>{t('pages.rules.title')}</h1>
          <p className={styles.heroSubtitle}>{t('pages.rules.subtitle')}</p>
        </div>
      </section>

      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{t('pages.rules.scoreTitle')}</h2>
        <span className={styles.sectionMeta}>
          {t('pages.rules.scoreMeta', undefined, { count: scoringRules.length })}
        </span>
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
        <p className={styles.noteText}>{t('pages.rules.note')}</p>
      </div>

      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{t('pages.rules.tiebreakTitle')}</h2>
        <span className={styles.sectionMeta}>{t('pages.rules.tiebreakMeta')}</span>
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
