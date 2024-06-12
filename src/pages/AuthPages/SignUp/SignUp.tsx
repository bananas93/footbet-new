import { Button, TextInput } from 'components';
import { useForm } from 'hooks';
import { useAppDispatch, useAppSelector } from 'store';
import { signUpUser } from 'store/slices/auth';
import styles from './SignUp.module.scss';
import { notify } from 'helpers';

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
    if (!/(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/.test(value))
      return 'Пароль має містити принаймні 8 символів, одну велику літеру та один спецсимвол';
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

  const { values, errors, handleChange, handleSubmit } = useForm<FormValues>(
    { name: '', email: '', phone: '', password: '', confirmPassword: '' },
    validationRules,
    (submittedValues: FormValues) => {
      handleSignUp(submittedValues);
    },
  );

  const handleSignUp = async (formValues: FormValues) => {
    try {
      await dispatch(signUpUser(formValues)).unwrap();
      notify.success('Ви успішно зареєструвались');
    } catch (err: any) {
      notify.error(err.message);
    }
  };

  return (
    <div className={styles.login}>
      <h1 className={styles.loginTitle}>Вхід</h1>
      <div className={styles.loginForm}>
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
        <Button loading={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Реєстрація...' : 'Зареєструватися'}
        </Button>
        <div>
          Вже зареєстровані?{' '}
          <Button variant="link" href="/signin">
            Увійти
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
