const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/),
);

const SW_DEPLOY_STORAGE_KEY = 'sw:deploy-revision';
const SW_RESET_GUARD_KEY = 'sw:last-reset';
const RESET_COOLDOWN_MS = 60 * 1000;

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const swUrl = `${process.env.PUBLIC_URL}/sw.js`;
const assetManifestUrl = `${process.env.PUBLIC_URL}/asset-manifest.json`;

type AssetManifest = {
  files?: Record<string, string>;
};

const getDeployRevision = async (): Promise<string | null> => {
  try {
    // The query string defeats an older service worker that still serves
    // asset-manifest.json from its own cache and hides every new deploy.
    const response = await fetch(`${assetManifestUrl}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }

    const manifest = (await response.json()) as AssetManifest;
    const files = manifest.files || {};

    const mainJs = files['main.js'] || '';
    const mainCss = files['main.css'] || '';
    const runtimeJs = files['runtime-main.js'] || '';

    if (!mainJs && !mainCss && !runtimeJs) {
      return null;
    }

    return [mainJs, mainCss, runtimeJs].join('|');
  } catch {
    return null;
  }
};

const shouldResetCachesForDeploy = async (): Promise<boolean> => {
  const currentRevision = await getDeployRevision();
  if (!currentRevision) {
    return false;
  }

  const previousRevision = readStorage(SW_DEPLOY_STORAGE_KEY);
  if (!previousRevision) {
    writeStorage(SW_DEPLOY_STORAGE_KEY, currentRevision);
    return false;
  }

  if (previousRevision === currentRevision) {
    return false;
  }

  // The reset ends in a reload, so it must never be able to repeat. An installed
  // PWA has no address bar: a reload loop there is a blank screen the user cannot
  // escape. Skip the reset unless the new revision was written down, and never
  // run two resets within a minute.
  if (!writeStorage(SW_DEPLOY_STORAGE_KEY, currentRevision)) {
    return false;
  }

  const lastReset = Number(readStorage(SW_RESET_GUARD_KEY)) || 0;
  if (Date.now() - lastReset < RESET_COOLDOWN_MS) {
    return false;
  }

  writeStorage(SW_RESET_GUARD_KEY, String(Date.now()));
  return true;
};

const resetServiceWorkerAndCaches = async () => {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
};

// An installed PWA can stay open for days without a single navigation, so the
// browser never checks for a new service worker on its own.
const watchForUpdates = (registration: ServiceWorkerRegistration) => {
  const checkForUpdate = () => {
    if (document.visibilityState !== 'visible') {
      return;
    }

    void registration.update().catch(() => {
      // Offline or the check failed: the next one will pick it up.
    });
  };

  document.addEventListener('visibilitychange', checkForUpdate);
  window.addEventListener('focus', checkForUpdate);
  checkForUpdate();
};

const registerValidSW = async () => {
  try {
    // No automatic reload when a new worker takes over. An installed PWA has no
    // address bar, so a reload that goes wrong leaves a blank screen with no way
    // out. The new worker takes over on the next launch instead.
    // updateViaCache: 'none' stops the browser from serving a stale sw.js
    // from its HTTP cache (up to 24h by default) and delaying every update.
    const registration = await navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' });
    watchForUpdates(registration);
  } catch (error) {
    console.error('Service worker registration failed:', error);
  }
};

const checkValidServiceWorker = async () => {
  try {
    const response = await fetch(swUrl, { headers: { 'Service-Worker': 'script' } });
    const contentType = response.headers.get('content-type');

    if (response.status === 404 || (contentType != null && !contentType.includes('javascript'))) {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      window.location.reload();
      return;
    }

    await registerValidSW();
  } catch {
    // Ignore network failures in local/offline dev mode.
  }
};

export const registerServiceWorker = () => {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const runRegistration = async () => {
      const shouldReset = await shouldResetCachesForDeploy();
      if (shouldReset) {
        await resetServiceWorkerAndCaches();
        window.location.reload();
        return;
      }

      if (isLocalhost) {
        await checkValidServiceWorker();
        return;
      }

      await registerValidSW();
    };

    void runRegistration();
  });
};

export const unregisterServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.unregister();
};
