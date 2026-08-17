import { TextInput } from 'components';
import { useForm } from 'hooks';
import { useAppDispatch, useAppSelector } from 'store';
import { Link, useNavigate } from 'react-router-dom';
import { AuthRoutesEnum } from 'routes/AuthRoutes';
import styles from './SetPassword.module.scss';
import { changePassword } from 'store/slices/auth';
import { notify } from 'helpers';
import { useI18n } from 'i18n';

interface FormValues {
  password: string;
  confirmPassword: string;
}

const SetPassword: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth.changePasswordRequest);

  const validationRules = {
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

  const { values, errors, handleChange, handleSubmit } = useForm<FormValues>(
    { password: '', confirmPassword: '' },
    validationRules,
    (submittedValues: any) => {
      handleChangePassword(submittedValues);
    },
  );

  const handleChangePassword = async (submittedValues: any) => {
    try {
      await dispatch(changePassword({ password: submittedValues.password })).unwrap();
      navigate(AuthRoutesEnum.SignIn);
      notify.success(t('auth.setPassword.success'));
    } catch (error: any) {
      notify.error(error.message);
    }
  };

  return (
    <div className={styles.auth}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>{t('auth.setPassword.eyebrow')}</span>
        <h1 className={styles.title}>{t('auth.setPassword.title')}</h1>
        <p className={styles.subtitle}>{t('auth.setPassword.subtitle')}</p>
      </header>

      <div className={styles.form}>
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

      <p className={styles.note}>{t('auth.setPassword.note')}</p>

      <button type="button" className={styles.submit} onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? t('auth.setPassword.submitLoading') : t('auth.setPassword.submit')}
      </button>

      <p className={styles.footer}>
        <Link to={AuthRoutesEnum.SignIn} className={styles.footerLink}>
          {t('auth.setPassword.backToSignIn')}
        </Link>
      </p>
    </div>
  );
};

export default SetPassword;
