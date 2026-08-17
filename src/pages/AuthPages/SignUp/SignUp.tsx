import { TextInput } from 'components';
import { useForm } from 'hooks';
import { useAppDispatch, useAppSelector } from 'store';
import { signUpUser } from 'store/slices/auth';
import styles from './SignUp.module.scss';
import {
  AUTH_EMAIL_LIMIT_PER_HOUR,
  formatRemainingTime,
  getAuthEmailAttemptsLeft,
  getAuthEmailRemainingMs,
  notify,
  registerAuthEmailAttempt,
} from 'helpers';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthRoutesEnum } from 'routes/AuthRoutes';
import { useI18n } from 'i18n';

const isRateLimitError = (message?: string) => {
  const normalizedMessage = (message || '').toLowerCase();
  return normalizedMessage.includes('email rate limit exceeded') || normalizedMessage.includes('rate limit');
};

interface FormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const SignUp: React.FC = () => {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth.signUpUserRequest);
  const [remainingMs, setRemainingMs] = useState<number>(getAuthEmailRemainingMs());

  const validationRules = {
    name: (value: string) => {
      if (!value) return t('auth.signUp.nameRequired');
      return '';
    },
    email: (value: string) => {
      if (!value) return t('auth.common.emailRequired');
      if (!/\S+@\S+\.\S+/.test(value)) return t('auth.common.emailInvalid');
      return '';
    },
    password: (value: string) => {
      if (!value) return t('auth.common.passwordRequired');
      if (value.length < 7) return t('auth.common.passwordMin');
      return '';
    },
    confirmPassword: (value: string, values: any) => {
      if (!value) return t('auth.common.passwordConfirmRequired');
      if (value !== values.password) return t('auth.common.passwordMismatch');
      return '';
    },
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
    { name: '', email: '', phone: '', password: '', confirmPassword: '' },
    validationRules,
    (submittedValues: FormValues) => {
      handleSignUp(submittedValues);
    },
  );

  const handleSignUp = async (formValues: FormValues) => {
    const currentRemainingMs = getAuthEmailRemainingMs();
    if (currentRemainingMs > 0) {
      setRemainingMs(currentRemainingMs);
      notify.error(
        t('auth.signUp.rateLimitWait', undefined, {
          limit: AUTH_EMAIL_LIMIT_PER_HOUR,
          time: formatRemainingTime(currentRemainingMs),
        }),
      );
      return;
    }

    try {
      await dispatch(signUpUser(formValues)).unwrap();
      registerAuthEmailAttempt();
      setRemainingMs(getAuthEmailRemainingMs());
      notify.success(t('auth.signUp.success'));
    } catch (err: any) {
      if (isRateLimitError(err.message)) {
        registerAuthEmailAttempt();
        const nextRemainingMs = getAuthEmailRemainingMs();
        setRemainingMs(nextRemainingMs);
        notify.error(
          t('auth.signUp.rateLimitRetry', undefined, {
            limit: AUTH_EMAIL_LIMIT_PER_HOUR,
            time: formatRemainingTime(nextRemainingMs),
          }),
        );
        return;
      }

      notify.error(err.message || t('auth.signUp.error'));
    }
  };

  const attemptsLeft = getAuthEmailAttemptsLeft();

  return (
    <div className={styles.auth}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>{t('auth.signUp.eyebrow')}</span>
        <h1 className={styles.title}>{t('auth.signUp.title')}</h1>
        <p className={styles.subtitle}>{t('auth.signUp.subtitle')}</p>
      </header>

      <div className={styles.form}>
        <TextInput
          name="name"
          type="text"
          label={t('auth.signUp.nameLabel')}
          value={values.name}
          error={errors.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder={t('auth.signUp.namePlaceholder')}
        />
        <TextInput
          name="email"
          type="email"
          label={t('auth.common.emailLabel')}
          value={values.email}
          error={errors.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder={t('auth.common.emailPlaceholder')}
        />
        <TextInput
          name="phone"
          type="tel"
          label={t('auth.signUp.phoneLabel')}
          value={values.phone}
          error={errors.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder={t('auth.signUp.phonePlaceholder')}
        />
        <div className={styles.formRow}>
          <TextInput
            name="password"
            type="password"
            label={t('auth.common.passwordLabel')}
            value={values.password}
            error={errors.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder={t('auth.common.passwordPlaceholder')}
          />
          <TextInput
            name="confirmPassword"
            type="password"
            label={t('auth.common.confirmPasswordLabel')}
            value={values.confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            placeholder={t('auth.common.confirmPasswordPlaceholder')}
          />
        </div>
      </div>

      <p className={styles.note}>
        {t('auth.common.supabaseLimitAttempts', undefined, {
          limit: AUTH_EMAIL_LIMIT_PER_HOUR,
          attempts: attemptsLeft,
        })}
      </p>

      <button type="button" className={styles.submit} onClick={handleSubmit} disabled={isLoading || remainingMs > 0}>
        {isLoading
          ? t('auth.signUp.submitLoading')
          : remainingMs > 0
            ? t('auth.common.repeatAfter', undefined, { time: formatRemainingTime(remainingMs) })
            : t('auth.signUp.submit')}
      </button>

      <p className={styles.footer}>
        {t('auth.signUp.alreadyRegistered')}{' '}
        <Link to={AuthRoutesEnum.SignIn} className={styles.footerLink}>
          {t('auth.signUp.signInLink')}
        </Link>
      </p>
    </div>
  );
};

export default SignUp;
