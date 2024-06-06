import { Button, TextInput } from 'components';
import { useForm } from 'hooks';
import styles from './SignIn.module.scss';
import { useAppDispatch, useAppSelector } from 'store';
import { signInUser } from 'store/slices/auth';

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

  const handleLogin = async (formValues: FormValues) => {
    try {
      await dispatch(signInUser(formValues)).unwrap();
    } catch (err: any) {
      setFieldError('email', '');
      setFieldError('password', 'Не правильний email або пароль');
    }
  };

  return (
    <div className={styles.login}>
      <h1 className={styles.loginTitle}>Вхід</h1>
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
      </div>
    </div>
  );
};

export default SignIn;
