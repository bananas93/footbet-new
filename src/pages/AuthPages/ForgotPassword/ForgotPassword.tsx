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

const isRateLimitError = (message?: string) => {
  const text = (message || '').toLowerCase();
  return text.includes('email rate limit exceeded') || text.includes('rate limit');
};

const buildForgotPasswordErrorMessage = (message?: string, remainingMs: number = 0) => {
  if (isRateLimitError(message)) {
    return `Ліміт Supabase: ${AUTH_EMAIL_LIMIT_PER_HOUR} листи/год. Спробуйте ще раз через ${formatRemainingTime(remainingMs)}.`;
  }

  return message || 'Помилка відправлення посилання для відновлення паролю';
};

interface FormValues {
  email: string;
}

const validationRules = {
  email: (value: string) => {
    if (!value) return 'Потрібно вказати email';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Email некоректний';
    return '';
  },
};

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth.resetPasswordRequest);
  const [remainingMs, setRemainingMs] = useState<number>(getAuthEmailRemainingMs());

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
        `Ліміт Supabase: ${AUTH_EMAIL_LIMIT_PER_HOUR} листи/год. Зачекайте ${formatRemainingTime(currentRemainingMs)}.`,
      );
      return;
    }

    try {
      await dispatch(resetPassword(formValues)).unwrap();
      registerAuthEmailAttempt();
      setRemainingMs(getAuthEmailRemainingMs());
      navigate(AuthRoutesEnum.SignIn);
      notify.success('Лист для відновлення паролю відправлено на ваш email');
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
        <span className={styles.eyebrow}>Відновлення</span>
        <h1 className={styles.title}>Забули пароль?</h1>
        <p className={styles.subtitle}>
          Вкажіть email, який використовували при реєстрації. Ми надішлемо посилання для встановлення нового пароля.
        </p>
      </header>

      <div className={styles.form}>
        <TextInput
          name="email"
          type="email"
          label="Email"
          value={values.email}
          error={errors.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="Ваш email"
        />
      </div>

      <p className={styles.note}>
        Ліміт Supabase: {AUTH_EMAIL_LIMIT_PER_HOUR} листи/год. Доступно спроб: {attemptsLeft}.
      </p>

      <button type="button" className={styles.submit} onClick={handleSubmit} disabled={isLoading || remainingMs > 0}>
        {isLoading
          ? 'Надсилання...'
          : remainingMs > 0
            ? `Повторно через ${formatRemainingTime(remainingMs)}`
            : 'Надіслати посилання'}
      </button>

      <p className={styles.footer}>
        <Link to={AuthRoutesEnum.SignIn} className={styles.footerLink}>
          Назад до входу
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
