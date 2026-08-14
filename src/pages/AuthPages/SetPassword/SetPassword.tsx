import { TextInput } from 'components';
import { useForm } from 'hooks';
import { useAppDispatch, useAppSelector } from 'store';
import { Link, useNavigate } from 'react-router-dom';
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
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth.changePasswordRequest);

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
      notify.success('Пароль успішно змінено');
    } catch (error: any) {
      notify.error(error.message);
    }
  };

  return (
    <div className={styles.auth}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Новий пароль</span>
        <h1 className={styles.title}>Встановіть новий пароль</h1>
        <p className={styles.subtitle}>Введіть новий пароль двічі, щоб підтвердити зміну.</p>
      </header>

      <div className={styles.form}>
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

      <p className={styles.note}>Пароль має містити принаймні 8 символів.</p>

      <button type="button" className={styles.submit} onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Завантаження...' : 'Змінити пароль'}
      </button>

      <p className={styles.footer}>
        <Link to={AuthRoutesEnum.SignIn} className={styles.footerLink}>
          Повернутися до входу
        </Link>
      </p>
    </div>
  );
};

export default SetPassword;
