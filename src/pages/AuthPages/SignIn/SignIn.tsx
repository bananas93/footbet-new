import { TextInput } from 'components';
import { useForm } from 'hooks';
import styles from './SignIn.module.scss';
import { useAppDispatch, useAppSelector } from 'store';
import { signInUser, signInWithGoogle } from 'store/slices/auth';
import { GoogleIcon } from 'assets/icons';
import { notify } from 'helpers';
import { Link } from 'react-router-dom';
import { AuthRoutesEnum } from 'routes/AuthRoutes';
import { useState } from 'react';

const validationRules = {
  email: (value: string) => {
    if (!value) return 'Потрібно вказати email';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Email некоректний';
    return '';
  },
  password: (value: string) => {
    if (!value) return 'Потрібно вказати пароль';
    return '';
  },
};

interface FormValues {
  email: string;
  password: string;
}

const SignIn: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth.signInUserRequest);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { values, errors, handleChange, setFieldError, handleSubmit } = useForm<FormValues>(
    { email: '', password: '' },
    validationRules,
    (submittedValues: FormValues) => {
      handleLogin(submittedValues);
    },
  );

  const handleLogin = async (formValues: FormValues) => {
    try {
      await dispatch(signInUser(formValues)).unwrap();
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('invalid login credentials')) {
        setFieldError('email', '');
        setFieldError('password', 'Не правильний email або пароль');
      }
      notify.error(err.message || 'Помилка входу');
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await dispatch(signInWithGoogle()).unwrap();
    } catch (err: any) {
      notify.error(err.message || 'Не вдалося увійти через Google');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={styles.auth}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Вхід</span>
        <h1 className={styles.title}>Вітаємо у Footbet</h1>
        <p className={styles.subtitle}>Увійдіть, щоб робити прогнози та стежити за таблицею турніру.</p>
      </header>

      <button type="button" onClick={handleGoogleLogin} className={styles.google} disabled={isGoogleLoading}>
        <GoogleIcon />
        {isGoogleLoading ? 'Переходимо до Google...' : 'Увійти через Google'}
      </button>

      <div className={styles.divider}>або</div>

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
        <TextInput
          name="password"
          type="password"
          label="Пароль"
          value={values.password}
          error={errors.password}
          onChange={(e) => handleChange('password', e.target.value)}
          placeholder="Ваш пароль"
        />
        <Link to={AuthRoutesEnum.ForgotPassword} className={styles.forgot}>
          Забули пароль?
        </Link>
      </div>

      <button type="button" className={styles.submit} onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Входимо...' : 'Увійти'}
      </button>

      <p className={styles.footer}>
        Не маєте акаунту?{' '}
        <Link to={AuthRoutesEnum.SignUp} className={styles.footerLink}>
          Зареєструватись
        </Link>
      </p>
    </div>
  );
};

export default SignIn;
