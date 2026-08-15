const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/),
);

const SW_RESET_VERSION = '2026-08-15-auth-routing';
const SW_RESET_STORAGE_KEY = 'sw:reset-version';

const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

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
    const shouldReset = localStorage.getItem(SW_RESET_STORAGE_KEY) !== SW_RESET_VERSION;
    if (shouldReset) {
      const reset = async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }

        localStorage.setItem(SW_RESET_STORAGE_KEY, SW_RESET_VERSION);
        window.location.reload();
      };

      void reset();
      return;
    }

    if (isLocalhost) {
      void checkValidServiceWorker();
      return;
    }

    void registerValidSW();
  });
};

export const unregisterServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.unregister();
};
