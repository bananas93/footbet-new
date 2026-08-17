import { TextInput } from 'components';
import {
  AUTH_EMAIL_LIMIT_PER_HOUR,
  formatRemainingTime,
  getAuthEmailAttemptsLeft,
  getAuthEmailRemainingMs,
  notify,
  registerAuthEmailAttempt,
} from 'helpers';
import { useForm } from 'hooks';
import { useAppDispatch, useAppSelector } from 'store';
import { resetPassword } from 'store/slices/auth';
import styles from './ForgotPassword.module.scss';
import { Link, useNavigate } from 'react-router-dom';
import { AuthRoutesEnum } from 'routes/AuthRoutes';
import { useEffect, useState } from 'react';
import { useI18n } from 'i18n';

const isRateLimitError = (message?: string) => {
  const text = (message || '').toLowerCase();
  return text.includes('email rate limit exceeded') || text.includes('rate limit');
};

interface FormValues {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth.resetPasswordRequest);
  const [remainingMs, setRemainingMs] = useState<number>(getAuthEmailRemainingMs());

  const validationRules = {
    email: (value: string) => {
      if (!value) return t('auth.common.emailRequired');
      if (!/\S+@\S+\.\S+/.test(value)) return t('auth.common.emailInvalid');
      return '';
    },
  };

  const buildForgotPasswordErrorMessage = (message?: string, nextRemainingMs: number = 0) => {
    if (isRateLimitError(message)) {
      return t('auth.forgotPassword.rateLimitRetry', undefined, {
        limit: AUTH_EMAIL_LIMIT_PER_HOUR,
        time: formatRemainingTime(nextRemainingMs),
      });
    }

    return message || t('auth.forgotPassword.error');
  };

  useEffect(() => {
    if (!remainingMs) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingMs(getAuthEmailRemainingMs());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remainingMs]);

  const { values, errors, handleChange, handleSubmit } = useForm<FormValues>(
    { email: '' },
    validationRules,
    (submittedValues: FormValues) => {
      handleResetPassword(submittedValues);
    },
  );

  const handleResetPassword = async (formValues: FormValues) => {
    const currentRemainingMs = getAuthEmailRemainingMs();
    if (currentRemainingMs > 0) {
      setRemainingMs(currentRemainingMs);
      notify.error(
        t('auth.forgotPassword.rateLimitWait', undefined, {
          limit: AUTH_EMAIL_LIMIT_PER_HOUR,
          time: formatRemainingTime(currentRemainingMs),
        }),
      );
      return;
    }

    try {
      await dispatch(resetPassword(formValues)).unwrap();
      registerAuthEmailAttempt();
      setRemainingMs(getAuthEmailRemainingMs());
      navigate(AuthRoutesEnum.SignIn);
      notify.success(t('auth.forgotPassword.success'));
    } catch (err: any) {
      if (isRateLimitError(err.message)) {
        registerAuthEmailAttempt();
      }

      const nextRemainingMs = getAuthEmailRemainingMs();
      setRemainingMs(nextRemainingMs);
      notify.error(buildForgotPasswordErrorMessage(err.message, nextRemainingMs));
    }
  };

  const attemptsLeft = getAuthEmailAttemptsLeft();

  return (
    <div className={styles.auth}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>{t('auth.forgotPassword.eyebrow')}</span>
        <h1 className={styles.title}>{t('auth.forgotPassword.title')}</h1>
        <p className={styles.subtitle}>{t('auth.forgotPassword.subtitle')}</p>
      </header>

      <div className={styles.form}>
        <TextInput
          name="email"
          type="email"
          label={t('auth.common.emailLabel')}
          value={values.email}
          error={errors.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder={t('auth.common.emailPlaceholder')}
        />
      </div>

      <p className={styles.note}>
        {t('auth.common.supabaseLimitAttempts', undefined, {
          limit: AUTH_EMAIL_LIMIT_PER_HOUR,
          attempts: attemptsLeft,
        })}
      </p>

      <button type="button" className={styles.submit} onClick={handleSubmit} disabled={isLoading || remainingMs > 0}>
        {isLoading
          ? t('auth.forgotPassword.submitLoading')
          : remainingMs > 0
            ? t('auth.common.repeatAfter', undefined, { time: formatRemainingTime(remainingMs) })
            : t('auth.forgotPassword.submit')}
      </button>

      <p className={styles.footer}>
        <Link to={AuthRoutesEnum.SignIn} className={styles.footerLink}>
          {t('auth.common.backToSignIn')}
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
