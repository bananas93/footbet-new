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

const isRateLimitError = (message?: string) => {
  const normalizedMessage = (message || '').toLowerCase();
  return normalizedMessage.includes('email rate limit exceeded') || normalizedMessage.includes('rate limit');
};

const validationRules = {
  name: (value: string) => {
    if (!value) return "Потрібно вказати ім'я";
    return '';
  },
  email: (value: string) => {
    if (!value) return 'Потрібно вказати email';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Email некоректний';
    return '';
  },
  password: (value: string) => {
    if (!value) return 'Потрібно вказати пароль';
    if (value.length < 7) return 'Пароль має містити принаймні 8 символів';
    return '';
  },
  confirmPassword: (value: string, values: any) => {
    if (!value) return 'Потрібно підтвердити пароль';
    if (value !== values.password) return 'Паролі не збігаються';
    return '';
  },
};

interface FormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const SignUp: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth.signUpUserRequest);
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
        `Ліміт Supabase: ${AUTH_EMAIL_LIMIT_PER_HOUR} листи/год. Зачекайте ${formatRemainingTime(currentRemainingMs)}.`,
      );
      return;
    }

    try {
      await dispatch(signUpUser(formValues)).unwrap();
      registerAuthEmailAttempt();
      setRemainingMs(getAuthEmailRemainingMs());
      notify.success('Ви успішно зареєструвались');
    } catch (err: any) {
      if (isRateLimitError(err.message)) {
        registerAuthEmailAttempt();
        const nextRemainingMs = getAuthEmailRemainingMs();
        setRemainingMs(nextRemainingMs);
        notify.error(
          `Ліміт Supabase: ${AUTH_EMAIL_LIMIT_PER_HOUR} листи/год. Спробуйте ще раз через ${formatRemainingTime(nextRemainingMs)}.`,
        );
        return;
      }

      notify.error(err.message || 'Помилка реєстрації');
    }
  };

  const attemptsLeft = getAuthEmailAttemptsLeft();

  return (
    <div className={styles.auth}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Реєстрація</span>
        <h1 className={styles.title}>Створіть акаунт</h1>
        <p className={styles.subtitle}>Кілька полів — і ви вже у турнірі прогнозів разом з друзями.</p>
      </header>

      <div className={styles.form}>
        <TextInput
          name="name"
          type="text"
          label="Ім'я"
          value={values.name}
          error={errors.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Вашe ім'я"
        />
        <TextInput
          name="email"
          type="email"
          label="Email"
          value={values.email}
          error={errors.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="Ваш email"
        />
        <TextInput
          name="phone"
          type="tel"
          label="Телефон"
          value={values.phone}
          error={errors.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="Ваш номер телефону"
        />
        <div className={styles.formRow}>
          <TextInput
            name="password"
            type="password"
            label="Пароль"
            value={values.password}
            error={errors.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="Ваш пароль"
          />
          <TextInput
            name="confirmPassword"
            type="password"
            label="Підтвердіть пароль"
            value={values.confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            placeholder="Підтвердіть пароль"
          />
        </div>
      </div>

      <p className={styles.note}>
        Ліміт Supabase: {AUTH_EMAIL_LIMIT_PER_HOUR} листи/год. Доступно спроб: {attemptsLeft}.
      </p>

      <button type="button" className={styles.submit} onClick={handleSubmit} disabled={isLoading || remainingMs > 0}>
        {isLoading
          ? 'Реєстрація...'
          : remainingMs > 0
            ? `Повторно через ${formatRemainingTime(remainingMs)}`
            : 'Зареєструватися'}
      </button>

      <p className={styles.footer}>
        Вже зареєстровані?{' '}
        <Link to={AuthRoutesEnum.SignIn} className={styles.footerLink}>
          Увійти
        </Link>
      </p>
    </div>
  );
};

export default SignUp;
