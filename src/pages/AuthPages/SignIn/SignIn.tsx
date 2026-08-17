import { TextInput } from 'components';
import { useForm } from 'hooks';
import styles from './SignIn.module.scss';
import { useAppDispatch, useAppSelector } from 'store';
import { signInUser, signInWithGoogle } from 'store/slices/auth';
import { GoogleIcon } from 'assets/icons';
import { notify } from 'helpers';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthRoutesEnum } from 'routes/AuthRoutes';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from 'i18n';

interface FormValues {
  email: string;
  password: string;
}

const SignIn: React.FC = () => {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading } = useAppSelector((state) => state.auth.signInUserRequest);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const redirectTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const from = params.get('from')?.trim();
    if (!from || !from.startsWith('/')) {
      return '/';
    }
    return from;
  }, [location.search]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const pendingFrom = sessionStorage.getItem('auth:returnTo') || redirectTo;
    sessionStorage.removeItem('auth:returnTo');
    navigate(pendingFrom || '/', { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  const validationRules = {
    email: (value: string) => {
      if (!value) return t('auth.common.emailRequired');
      if (!/\S+@\S+\.\S+/.test(value)) return t('auth.common.emailInvalid');
      return '';
    },
    password: (value: string) => {
      if (!value) return t('auth.common.passwordRequired');
      return '';
    },
  };

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
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('invalid login credentials')) {
        setFieldError('email', '');
        setFieldError('password', t('auth.signIn.invalidCredentials'));
      }
      notify.error(err.message || t('auth.signIn.loginError'));
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      sessionStorage.setItem('auth:returnTo', redirectTo);
      await dispatch(signInWithGoogle()).unwrap();
    } catch (err: any) {
      notify.error(err.message || t('auth.signIn.googleLoginError'));
      sessionStorage.removeItem('auth:returnTo');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={styles.auth}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>{t('auth.signIn.eyebrow')}</span>
        <h1 className={styles.title}>{t('auth.signIn.title')}</h1>
        <p className={styles.subtitle}>{t('auth.signIn.subtitle')}</p>
      </header>

      <button type="button" onClick={handleGoogleLogin} className={styles.google} disabled={isGoogleLoading}>
        <GoogleIcon />
        {isGoogleLoading ? t('auth.signIn.googleInProgress') : t('auth.signIn.googleButton')}
      </button>

      <div className={styles.divider}>{t('auth.signIn.or')}</div>

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
        <TextInput
          name="password"
          type="password"
          label={t('auth.common.passwordLabel')}
          value={values.password}
          error={errors.password}
          onChange={(e) => handleChange('password', e.target.value)}
          placeholder={t('auth.common.passwordPlaceholder')}
        />
        <Link to={AuthRoutesEnum.ForgotPassword} className={styles.forgot}>
          {t('auth.signIn.forgotPassword')}
        </Link>
      </div>

      <button type="button" className={styles.submit} onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? t('auth.signIn.submitLoading') : t('auth.signIn.submit')}
      </button>

      <p className={styles.footer}>
        {t('auth.signIn.noAccount')}{' '}
        <Link to={AuthRoutesEnum.SignUp} className={styles.footerLink}>
          {t('auth.signIn.signUpLink')}
        </Link>
      </p>
    </div>
  );
};

export default SignIn;
