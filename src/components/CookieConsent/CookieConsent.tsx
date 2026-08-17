import { useEffect, useState } from 'react';
import { ConsentValue, getAnalyticsConsent, setAnalyticsConsent } from 'helpers';
import styles from './CookieConsent.module.scss';
import { useI18n } from 'i18n';

const CookieConsent: React.FC = () => {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const savedValue = getAnalyticsConsent();
    if (!savedValue) {
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (value: ConsentValue) => {
    setAnalyticsConsent(value);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside className={styles.banner} role="dialog" aria-live="polite" aria-label={t('components.cookie.ariaLabel')}>
      <div className={styles.content}>
        <p className={styles.text}>{t('components.cookie.text')}</p>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={() => handleConsent('necessary')}>
            {t('components.cookie.necessary')}
          </button>
          <button type="button" className={styles.primaryButton} onClick={() => handleConsent('accepted')}>
            {t('components.cookie.acceptAll')}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CookieConsent;
