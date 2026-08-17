import styles from './ProjectSupport.module.scss';
import { useI18n } from 'i18n';

const MONOBANK_JAR_URL = 'https://send.monobank.ua/jar/3FAaWCR37r';

const SupportIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    aria-hidden
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M12 20s-6.8-4.2-8.8-8A5.2 5.2 0 0 1 12 6.1 5.2 5.2 0 0 1 20.8 12C18.8 15.8 12 20 12 20Z" />
    <path d="M8.8 12h6.4" />
    <path d="M12 8.8v6.4" />
  </svg>
);

const WalletIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    aria-hidden
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="2.5" />
    <path d="M16 12h.01" />
    <path d="M3 9h18" />
  </svg>
);

const ProjectSupport: React.FC = () => {
  const { t } = useI18n();
  const thanks = [
    t('pages.projectSupport.thanks.one'),
    t('pages.projectSupport.thanks.two'),
    t('pages.projectSupport.thanks.three'),
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>
            <SupportIcon className={styles.heroEyebrowIcon} />
            {t('pages.projectSupport.eyebrow')}
          </span>
          <h1 className={styles.heroTitle}>{t('pages.projectSupport.title')}</h1>
          <p className={styles.heroSubtitle}>
            {t('pages.projectSupport.subtitleLine1')}
            <br /> {t('pages.projectSupport.subtitleLine2')}
          </p>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIconWrap}>
            <WalletIcon className={styles.cardIcon} />
          </span>
          <div>
            <h2 className={styles.cardTitle}>{t('pages.projectSupport.cardTitle')}</h2>
            <p className={styles.cardSubtitle}>{t('pages.projectSupport.cardSubtitle')}</p>
          </div>
        </div>

        <div className={styles.amountBox}>
          <span className={styles.amountLabel}>{t('pages.projectSupport.amountLabel')}</span>
          <p className={styles.amountValue}>{t('pages.projectSupport.amountValue')}</p>
        </div>

        <a className={styles.donateButton} href={MONOBANK_JAR_URL} target="_blank" rel="noreferrer noopener">
          {t('pages.projectSupport.cta')}
        </a>

        <p className={styles.bankLinkText}>
          {t('pages.projectSupport.jarLinkLabel')}{' '}
          <a href={MONOBANK_JAR_URL} target="_blank" rel="noreferrer noopener">
            send.monobank.ua/jar/3FAaWCR37r
          </a>
        </p>
      </section>

      <section className={styles.thanksSection}>
        <h2 className={styles.thanksTitle}>{t('pages.projectSupport.thanksTitle')}</h2>
        <ul className={styles.thanksList}>
          {thanks.map((item) => (
            <li key={item} className={styles.thanksItem}>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ProjectSupport;
