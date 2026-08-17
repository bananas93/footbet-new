import { useEffect, useMemo, useState } from 'react';
import { enablePushSubscription, getPushSupportState, trackEvent } from 'helpers';
import { useAppSelector } from 'store';
import styles from './InstallBanner.module.scss';
import { useI18n } from 'i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'installBannerDismissedAt';
const INSTALLED_KEY = 'appInstalledFromPrompt';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const isDismissedRecently = (): boolean => {
  try {
    const value = localStorage.getItem(DISMISS_KEY);
    if (!value) {
      return false;
    }

    const dismissedAt = Number(value);
    if (!Number.isFinite(dismissedAt)) {
      return false;
    }

    return Date.now() - dismissedAt < DISMISS_TTL_MS;
  } catch {
    return false;
  }
};

const isInstalled = (): boolean => {
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const navigatorStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const fromPrompt = localStorage.getItem(INSTALLED_KEY) === '1';
  return standalone || navigatorStandalone || fromPrompt;
};

const isIOSDevice = (): boolean => {
  const ua = window.navigator.userAgent.toLowerCase();
  const iOSByUa = /iphone|ipad|ipod/.test(ua);
  const iPadDesktopMode = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  return iOSByUa || iPadDesktopMode;
};

const InstallBanner: React.FC = () => {
  const { t } = useI18n();
  const userId = useAppSelector((state) => state.user.user?.id || '');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const canShowBanner = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return !isInstalled() && !isDismissedRecently();
  }, []);

  useEffect(() => {
    if (!canShowBanner) {
      return;
    }

    if (isIOSDevice()) {
      setShowIOSGuide(true);
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowIOSGuide(false);
      setIsVisible(true);
    };

    const requestPushAfterInstall = async () => {
      if (getPushSupportState() !== 'supported') {
        return;
      }

      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (Notification.permission === 'granted' && userId) {
        await enablePushSubscription(userId);
      }
    };

    const handleInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, '1');
      setIsVisible(false);
      setDeferredPrompt(null);
      trackEvent('pwa_installed');
      void requestPushAfterInstall();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [canShowBanner, userId]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setIsVisible(false);
    setShowIOSGuide(false);
    trackEvent('pwa_install_banner_dismissed');
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    trackEvent('pwa_install_clicked');

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      trackEvent('pwa_install_prompt_result', { outcome: choice.outcome });
      if (choice.outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, '1');
        setIsVisible(false);
      }
    } finally {
      setDeferredPrompt(null);
      setIsInstalling(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  const isManualIOSInstall = showIOSGuide && !deferredPrompt;

  return (
    <aside className={styles.banner} role="status" aria-live="polite">
      <div className={styles.textWrap}>
        <h3 className={styles.title}>{t('components.installBanner.title')}</h3>
        <p className={styles.text}>{t('components.installBanner.text')}</p>
        {isManualIOSInstall && <p className={styles.note}>{t('components.installBanner.iosNote')}</p>}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={handleDismiss}>
          {t('components.installBanner.later')}
        </button>
        {!!deferredPrompt && (
          <button type="button" className={styles.primary} onClick={handleInstall} disabled={isInstalling}>
            {isInstalling ? t('components.installBanner.installing') : t('components.installBanner.install')}
          </button>
        )}
      </div>
    </aside>
  );
};

export default InstallBanner;
