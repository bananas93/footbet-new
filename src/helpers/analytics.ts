import ReactGA from 'react-ga4';

export const COOKIE_CONSENT_KEY = 'footbet_cookie_consent_v1';
export const ANALYTICS_CONSENT_EVENT = 'footbet:analytics-consent-changed';

export type ConsentValue = 'accepted' | 'necessary';

type AnalyticsParams = Record<string, string | number | boolean | undefined>;

const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID?.trim() || '';

let isInitialized = false;

const getGaDisableKey = () => `ga-disable-${GA_MEASUREMENT_ID}`;

const setGaDisabled = (disabled: boolean) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
    return;
  }

  (window as unknown as Record<string, unknown>)[getGaDisableKey()] = disabled;
};

export const getAnalyticsConsent = (): ConsentValue | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === 'accepted' || value === 'necessary') {
    return value;
  }

  return null;
};

export const isAnalyticsAllowed = () => getAnalyticsConsent() === 'accepted';

export const setAnalyticsConsent = (value: ConsentValue) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  window.dispatchEvent(
    new CustomEvent(ANALYTICS_CONSENT_EVENT, {
      detail: { value },
    }),
  );

  if (value !== 'accepted') {
    setGaDisabled(true);
  }
};

export const initAnalytics = () => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
    return false;
  }

  if (!isInitialized) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    isInitialized = true;
  }

  const allowed = isAnalyticsAllowed();
  setGaDisabled(!allowed);
  return allowed;
};

const normalizeParams = (params: AnalyticsParams) => {
  return Object.entries(params).reduce<Record<string, string | number | boolean>>((acc, [key, value]) => {
    if (typeof value !== 'undefined') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

export const trackPageView = (path: string) => {
  if (!path || !initAnalytics()) {
    return;
  }

  ReactGA.send({
    hitType: 'pageview',
    page: path,
  });
};

export const trackEvent = (eventName: string, params: AnalyticsParams = {}) => {
  if (!eventName || !initAnalytics()) {
    return;
  }

  ReactGA.event(eventName, normalizeParams(params));
};
