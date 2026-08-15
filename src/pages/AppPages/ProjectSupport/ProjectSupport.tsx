import styles from './ProjectSupport.module.scss';

const MONOBANK_JAR_URL = 'https://send.monobank.ua/jar/3FAaWCR37r';

const thanks = [
  'Дякуємо кожному, хто підтримує розвиток Footbet.',
  'Кожен донат допомагає покривати домен, підтримку інфраструктури та розвиток нових функцій.',
  'Навіть невелика сума - це реальний внесок у стабільність проєкту.',
];

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
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>
            <SupportIcon className={styles.heroEyebrowIcon} />
            Підтримка
          </span>
          <h1 className={styles.heroTitle}>Допомога проєкту</h1>
          <p className={styles.heroSubtitle}>
            Щоб Footbet стабільно працював і розвивався, проєкту потрібно приблизно
            <br /> 10000 грн на рік.
          </p>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIconWrap}>
            <WalletIcon className={styles.cardIcon} />
          </span>
          <div>
            <h2 className={styles.cardTitle}>Фінансова підтримка</h2>
            <p className={styles.cardSubtitle}>Якщо маєте можливість, будь ласка, допомагайте підтримувати проєкт.</p>
          </div>
        </div>

        <div className={styles.amountBox}>
          <span className={styles.amountLabel}>Орієнтовна потреба на рік</span>
          <p className={styles.amountValue}>10 000 грн</p>
        </div>

        <a className={styles.donateButton} href={MONOBANK_JAR_URL} target="_blank" rel="noreferrer noopener">
          Підтримати через Monobank
        </a>

        <p className={styles.bankLinkText}>
          Посилання на банку:{' '}
          <a href={MONOBANK_JAR_URL} target="_blank" rel="noreferrer noopener">
            send.monobank.ua/jar/3FAaWCR37r
          </a>
        </p>
      </section>

      <section className={styles.thanksSection}>
        <h2 className={styles.thanksTitle}>Подяка спільноті</h2>
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
