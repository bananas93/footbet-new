const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/),
);

const SW_DEPLOY_STORAGE_KEY = 'sw:deploy-revision';

const swUrl = `${process.env.PUBLIC_URL}/sw.js`;
const assetManifestUrl = `${process.env.PUBLIC_URL}/asset-manifest.json`;

type AssetManifest = {
  files?: Record<string, string>;
};

const getDeployRevision = async (): Promise<string | null> => {
  try {
    const response = await fetch(assetManifestUrl, { cache: 'no-store' });
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

  const previousRevision = localStorage.getItem(SW_DEPLOY_STORAGE_KEY);
  if (!previousRevision) {
    localStorage.setItem(SW_DEPLOY_STORAGE_KEY, currentRevision);
    return false;
  }

  if (previousRevision === currentRevision) {
    return false;
  }

  localStorage.setItem(SW_DEPLOY_STORAGE_KEY, currentRevision);
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

const registerValidSW = async () => {
  try {
    await navigator.serviceWorker.register(swUrl);
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
