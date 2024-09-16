import { Button, TextInput } from 'components';
import { notify } from 'helpers';
import { useForm } from 'hooks';
import { useAppDispatch, useAppSelector } from 'store';
import { resetPassword } from 'store/slices/auth';
import styles from './ForgotPassword.module.scss';
import { Link, useNavigate } from 'react-router-dom';
import { AuthRoutesEnum } from 'routes/AuthRoutes';

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

  const { values, errors, handleChange, handleSubmit } = useForm<FormValues>(
    { email: '' },
    validationRules,
    (submittedValues: FormValues) => {
      handleResetPassword(submittedValues);
    },
  );

  const handleResetPassword = async (formValues: FormValues) => {
    try {
      await dispatch(resetPassword(formValues)).unwrap();
      navigate(AuthRoutesEnum.CheckCode, { state: formValues.email });
      notify.success('Посилання для відновлення паролю відправлено на ваш email');
    } catch (err: any) {
      notify.error(err.message || 'Помилка відправлення посилання для відновлення паролю');
    }
  };

  return (
    <div className={styles.login}>
      <h1 className={styles.loginTitle}>Забули пароль?</h1>
      <div className={styles.loginForm}>
        <TextInput
          name="email"
          type="email"
          label="Email"
          value={values.email}
          error={errors.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="Ваш email"
        />
        <Button loading={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Надсилання...' : 'Надіслати'}
        </Button>
        <div className={styles.loginForgotPassword}>
          <Link to={AuthRoutesEnum.SignIn}>Назад</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
