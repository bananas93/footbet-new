import { Button, TextInput } from 'components';
import { useForm } from 'hooks';
import { useAppDispatch, useAppSelector } from 'store';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthRoutesEnum } from 'routes/AuthRoutes';
import styles from './SetPassword.module.scss';
import { changePassword } from 'store/slices/auth';
import { notify } from 'helpers';

interface FormValues {
  password: string;
  confirmPassword: string;
}

const validationRules = {
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

const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { email, code } = state as { email: string; code: string };
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth.changePasswordRequest);

  const { values, errors, handleChange, handleSubmit } = useForm<FormValues>(
    { password: '', confirmPassword: '' },
    validationRules,
    (submittedValues: any) => {
      console.log(submittedValues);
      handleChangePassword(submittedValues);
    },
  );

  const handleChangePassword = async (submittedValues: any) => {
    try {
      const data = {
        password: submittedValues.password,
        code,
        email,
      };
      await dispatch(changePassword(data)).unwrap();
      navigate(AuthRoutesEnum.SignIn);
      notify.success('Пароль успішно змінено');
    } catch (error: any) {
      notify.error(error.message);
    }
  };

  return (
    <div className={styles.login}>
      <h1 className={styles.loginTitle}>Встановити новий пароль</h1>
      <div className={styles.loginForm}>
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
          {isLoading ? 'Завантаження...' : 'Змінити пароль'}
        </Button>
      </div>
    </div>
  );
};

export default SetPassword;
