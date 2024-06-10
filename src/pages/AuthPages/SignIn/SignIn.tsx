import { Button, TextInput } from 'components';
import { useForm } from 'hooks';
import styles from './SignIn.module.scss';
import { useAppDispatch, useAppSelector } from 'store';
import { setIsAuthenticated, signInUser } from 'store/slices/auth';
import { GoogleIcon } from 'assets/icons';
import { http, saveAccessToken, saveRefreshToken } from 'helpers';
import { useEffect } from 'react';

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

  const { values, errors, handleChange, setFieldError, handleSubmit } = useForm<FormValues>(
    { email: '', password: '' },
    validationRules,
    (submittedValues: FormValues) => {
      handleLogin(submittedValues);
    },
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('accessToken');
    const refreshToken = urlParams.get('refreshToken');
    if (token && refreshToken) {
      saveAccessToken(token);
      saveRefreshToken(refreshToken);
      dispatch(setIsAuthenticated());
    }
  }, [dispatch]);

  const handleLogin = async (formValues: FormValues) => {
    try {
      await dispatch(signInUser(formValues)).unwrap();
    } catch (err: any) {
      setFieldError('email', '');
      setFieldError('password', 'Не правильний email або пароль');
    }
  };

  const handleGoogleLogin = () => {
    http.auth.get('/auth/auth');
  };

  return (
    <div className={styles.login}>
      <h1 className={styles.loginTitle}>Вхід</h1>
      <div className={styles.loginForm}>
        <div>
          <a
            href={`${process.env.REACT_APP_API_URL}/api/auth/auth`}
            onClick={handleGoogleLogin}
            className={styles.loginGoogle}>
            Увійти за допомогою <GoogleIcon />
          </a>
        </div>
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
        <div className={styles.loginForgotPassword}>
          <Button variant="link" href="/">
            Забули пароль?
          </Button>
        </div>
        <Button loading={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Входимо...' : 'Вхід'}
        </Button>
        <div>
          Не маєте акаунту?{' '}
          <Button variant="link" href="/signup">
            Зареєструватись
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
