import { useEffect, useState } from 'react';
import styles from './CookieConsent.module.scss';

const COOKIE_CONSENT_KEY = 'footbet_cookie_consent_v1';

type ConsentValue = 'accepted' | 'necessary';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const savedValue = window.localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentValue | null;
    if (!savedValue) {
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (value: ConsentValue) => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside className={styles.banner} role="dialog" aria-live="polite" aria-label="Налаштування cookie">
      <div className={styles.content}>
        <p className={styles.text}>
          Ми використовуємо cookie для входу в акаунт, збереження сесії та покращення роботи сайту. Ви можете прийняти всі cookie або залишити лише необхідні.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={() => handleConsent('necessary')}>
            Лише необхідні
          </button>
          <button type="button" className={styles.primaryButton} onClick={() => handleConsent('accepted')}>
            Прийняти всі
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CookieConsent;
