import styles from './LoginLayout.module.scss';

interface LoginLayoutProps {
  children: React.ReactNode;
}

const iconProps = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const BallIcon = () => (
  <svg {...iconProps} className={styles.brandIcon}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2l2.8 2-1 3.3h-3.6l-1-3.3 2.8-2Z" />
    <path d="M12 3.5v3.7M6.1 9.4l4.1 2.9M17.9 9.4l-4.1 2.9M9.3 15.4 7.6 19M14.7 15.4 16.4 19" />
  </svg>
);

const ChartIcon = () => (
  <svg {...iconProps} className={styles.featureIcon}>
    <path d="M4 19.5V4.5M4 19.5h16" />
    <path d="M8 16v-4M12 16V8M16 16v-6" />
  </svg>
);

const UsersIcon = () => (
  <svg {...iconProps} className={styles.featureIcon}>
    <circle cx="9.5" cy="9" r="3.2" />
    <path d="M4 19c0-2.6 2.5-4.4 5.5-4.4s5.5 1.8 5.5 4.4" />
    <path d="M16 6.4a3 3 0 0 1 0 5.7M17.6 14.9c1.6.6 2.7 1.9 2.7 3.6" />
  </svg>
);

const TrophyIcon = () => (
  <svg {...iconProps} className={styles.featureIcon}>
    <path d="M8 4h8v4.5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5.5H5.5V7a3 3 0 0 0 2.8 3M16 5.5h2.5V7a3 3 0 0 1-2.8 3" />
    <path d="M12 12.5V16M9 20h6M10 16h4l.5 4h-5l.5-4Z" />
  </svg>
);

const features = [
  {
    icon: <ChartIcon />,
    title: 'Live-таблиця',
    text: 'Бали й позиції оновлюються після кожного матчу.',
  },
  {
    icon: <UsersIcon />,
    title: 'Приватні кімнати',
    text: 'Створюй турнір і змагайся з друзями та колегами.',
  },
  {
    icon: <TrophyIcon />,
    title: 'Досягнення',
    text: 'Серії точних прогнозів, бонуси й нагороди сезону.',
  },
];

const LoginLayout: React.FC<LoginLayoutProps> = ({ children }) => {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.aside}>
          <div className={styles.asideGlow} aria-hidden="true" />
          <div className={styles.asideInner}>
            <div className={styles.brand}>
              <span className={styles.brandMark}>
                <BallIcon />
              </span>
              <span className={styles.brandText}>
                <span className={styles.brandName}>Footbet</span>
                <span className={styles.brandTagline}>Турнір прогнозів</span>
              </span>
            </div>

            <div className={styles.intro}>
              <span className={styles.eyebrow}>Прогнози на футбол</span>
              <p className={styles.introTitle}>Вгадуй результати, збирай бали, вигравай у друзів</p>
              <p className={styles.introSubtitle}>
                Один акаунт для всіх турнірів: матчі, таблиці, кімнати та статистика в одному місці.
              </p>
            </div>

            <ul className={styles.features}>
              {features.map((feature) => (
                <li className={styles.feature} key={feature.title}>
                  <span className={styles.featureBadge}>{feature.icon}</span>
                  <span className={styles.featureBody}>
                    <span className={styles.featureTitle}>{feature.title}</span>
                    <span className={styles.featureText}>{feature.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className={styles.content}>
          <div className={styles.card}>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default LoginLayout;
