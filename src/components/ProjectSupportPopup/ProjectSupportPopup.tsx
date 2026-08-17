import { useEffect, useState } from 'react';
import Modal from 'components/Modal/Modal';
import { readLocalCache, writeLocalCache } from 'helpers';
import styles from './ProjectSupportPopup.module.scss';
import { useI18n } from 'i18n';

const MONOBANK_JAR_URL = 'https://send.monobank.ua/jar/3FAaWCR37r';
const POPUP_CACHE_KEY = 'project-support-popup-seen';
const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;

const ProjectSupportPopup: React.FC = () => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const markAsSeen = () => {
    writeLocalCache<boolean>(POPUP_CACHE_KEY, true, ONE_WEEK_SECONDS);
  };

  const handleClose = () => {
    markAsSeen();
    setIsOpen(false);
  };

  const handleDonateClick = () => {
    markAsSeen();
  };

  useEffect(() => {
    const alreadySeen = readLocalCache<boolean>(POPUP_CACHE_KEY);
    if (alreadySeen) {
      return;
    }

    setIsOpen(true);
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('components.projectSupportPopup.title')}>
      <div className={styles.content}>
        <p className={styles.text}>{t('components.projectSupportPopup.text1')}</p>
        <p className={styles.text}>{t('components.projectSupportPopup.text2')}</p>

        <a
          className={styles.cta}
          href={MONOBANK_JAR_URL}
          target="_blank"
          rel="noreferrer noopener"
          onClick={handleDonateClick}>
          {t('components.projectSupportPopup.cta')}
        </a>

        <p className={styles.linkText}>
          {t('components.projectSupportPopup.bankLink')}{' '}
          <a href={MONOBANK_JAR_URL} target="_blank" rel="noreferrer noopener">
            send.monobank.ua/jar/3FAaWCR37r
          </a>
        </p>
      </div>
    </Modal>
  );
};

export default ProjectSupportPopup;
