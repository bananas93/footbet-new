import { useEffect, useState } from 'react';
import Modal from 'components/Modal/Modal';
import { readLocalCache, writeLocalCache } from 'helpers';
import styles from './ProjectSupportPopup.module.scss';

const MONOBANK_JAR_URL = 'https://send.monobank.ua/jar/3FAaWCR37r';
const POPUP_CACHE_KEY = 'project-support-popup-seen';
const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;

const ProjectSupportPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const alreadySeen = readLocalCache<boolean>(POPUP_CACHE_KEY);
    if (alreadySeen) {
      return;
    }

    setIsOpen(true);
    writeLocalCache<boolean>(POPUP_CACHE_KEY, true, ONE_WEEK_SECONDS);
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Підтримка Footbet">
      <div className={styles.content}>
        <p className={styles.text}>
          Для стабільної роботи та розвитку Footbet проєкту потрібно приблизно <strong>10 000 грн на рік</strong>.
        </p>
        <p className={styles.text}>
          Якщо маєте можливість, будь ласка, підтримайте проєкт. Дякуємо за вашу довіру і допомогу.
        </p>

        <a className={styles.cta} href={MONOBANK_JAR_URL} target="_blank" rel="noreferrer noopener">
          Підтримати через Monobank
        </a>

        <p className={styles.linkText}>
          Посилання на банку:{' '}
          <a href={MONOBANK_JAR_URL} target="_blank" rel="noreferrer noopener">
            send.monobank.ua/jar/3FAaWCR37r
          </a>
        </p>
      </div>
    </Modal>
  );
};

export default ProjectSupportPopup;
