import { translate } from 'i18n';

const AUTH_EMAIL_ATTEMPTS_KEY = 'auth-email-attempts';

export const AUTH_EMAIL_LIMIT_PER_HOUR = 2;
export const AUTH_EMAIL_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const getAttempts = () => {
  const raw = localStorage.getItem(AUTH_EMAIL_ATTEMPTS_KEY);
  if (!raw) {
    return [] as number[];
  }

  try {
    const parsed = JSON.parse(raw) as number[];
    if (!Array.isArray(parsed)) {
      return [] as number[];
    }

    const now = Date.now();
    return parsed.filter((value) => Number.isFinite(value) && now - value < AUTH_EMAIL_LIMIT_WINDOW_MS);
  } catch {
    return [] as number[];
  }
};

const saveAttempts = (attempts: number[]) => {
  localStorage.setItem(AUTH_EMAIL_ATTEMPTS_KEY, JSON.stringify(attempts));
};

export const registerAuthEmailAttempt = () => {
  const attempts = getAttempts();
  attempts.push(Date.now());
  saveAttempts(attempts);
};

export const getAuthEmailRemainingMs = () => {
  const attempts = getAttempts();
  saveAttempts(attempts);

  if (attempts.length < AUTH_EMAIL_LIMIT_PER_HOUR) {
    return 0;
  }

  const oldestAttempt = attempts[0];
  return Math.max(0, AUTH_EMAIL_LIMIT_WINDOW_MS - (Date.now() - oldestAttempt));
};

export const getAuthEmailAttemptsLeft = () => {
  const attempts = getAttempts();
  return Math.max(0, AUTH_EMAIL_LIMIT_PER_HOUR - attempts.length);
};

export const formatRemainingTime = (remainingMs: number) => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return translate('helpers.time.minSec', undefined, { minutes, seconds });
  }

  return translate('helpers.time.sec', undefined, { seconds });
};
