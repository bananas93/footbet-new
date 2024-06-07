import { useAppDispatch, useAppSelector } from 'store';
import styles from './User.module.scss';
import { Button, Card, TextInput } from 'components';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { useForm } from 'hooks';
import { editUserProfile } from 'store/slices/user';
import { notify } from 'helpers';
import { logout } from 'store/slices/auth';

const validationRules = {
  name: (value: string) => {
    if (!value) return "Потрібно вказати ім'я";
    return '';
  },
};

interface FormValues {
  name: string;
  nickname: string;
  phone: string;
  avatar: string;
}

const User: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  const { isLoading } = useAppSelector((state) => state.user.editUserProfileRequest);

  const handleSaveProfile = async (formValues: FormValues) => {
    await dispatch(editUserProfile(formValues)).unwrap();
    notify.success('Профіль збережено');
  };

  const { values, errors, handleChange, handleSubmit } = useForm<FormValues>(
    {
      name: user?.name || '',
      phone: user?.phone || '',
      nickname: user?.nickname || '',
      avatar: '',
    },
    validationRules,
    (submittedValues: FormValues) => {
      handleSaveProfile(submittedValues);
    },
  );

  const isFormChanged = () => {
    const formValues = {
      ...user,
      ...values,
    };
    return JSON.stringify(formValues) !== JSON.stringify(user);
  };

  const isChanged = isFormChanged();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('reduxState');
  };

  console.log('isLoading', isLoading);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.user}>
      <Card title="Деталі профілю">
        <Tabs className={styles.tabs}>
          <TabList className={styles.tabsList}>
            <Tab className={styles.tabsItem}>Деталі профілю</Tab>
            <Tab className={styles.tabsItem}>Політика конфіденційності</Tab>
            <Button className={styles.tabsLogout} variant="link" onClick={handleLogout}>
              Вийти
            </Button>
          </TabList>
          <div className={styles.tabsItems}>
            <TabPanel className={styles.tabsPanel}>
              <div className={styles.userForm}>
                <div className={styles.userFormControl}>
                  <TextInput name="email" label="Email" value={user.email} error={errors.email} disabled />
                </div>
                <div className={styles.userFormControl}>
                  <TextInput
                    name="name"
                    label="Ім’я"
                    onChange={(e) => handleChange('name', e.target.value)}
                    value={values.name}
                    error={errors.name}
                  />
                </div>
                <div className={styles.userFormControl}>
                  <TextInput
                    name="nickname"
                    label="Нікнейм"
                    onChange={(e) => handleChange('nickname', e.target.value)}
                    value={values.nickname}
                  />
                </div>
                <div className={styles.userFormControl}>
                  <TextInput
                    name="phone"
                    label="Телефон"
                    onChange={(e) => handleChange('phone', e.target.value)}
                    value={values.phone}
                  />
                </div>
                <div className={styles.userFormControl}>
                  <input type="file" name="avatar" accept="image/*" />
                </div>
                <div className={styles.userFormControl}>
                  <Button
                    className={styles.userFormButton}
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!isChanged}
                    loading={isLoading}>
                    {isLoading ? 'Збереження...' : 'Зберегти'}
                  </Button>
                </div>
              </div>
            </TabPanel>
            <TabPanel className={styles.tabsPanel}>
              <div className={styles.privacy}>
                <h1>Політика конфіденційності</h1>
                <h2>Вступ</h2>
                <p>
                  Ця Політика конфіденційності визначає, як наш вебсайт (footbet.pp.ua) збирає, використовує, зберігає
                  та захищає персональні дані користувачів. Сайт призначений для користувачів, які реєструються та
                  ставлять прогнози на футбольні матчі в рамках некомерційних змагань з іншими гравцями.
                </p>
                <h2>1. Збір інформації</h2>
                <h3>1.1. Персональні дані</h3>
                <p>Ми можемо збирати такі персональні дані:</p>
                <ul>
                  <li>Ім'я</li>
                  <li>Електронна адреса</li>
                  <li>Логін та пароль</li>
                  <li>Інформація про активність на Сайті</li>
                </ul>
                <h3>1.2. Автоматично зібрані дані</h3>
                <p>Ми також можемо автоматично збирати такі дані:</p>
                <ul>
                  <li>IP-адреса</li>
                  <li>Тип браузера</li>
                  <li>Час доступу та сторінки, які ви переглядаєте</li>
                </ul>
                <h2>2. Використання зібраної інформації</h2>
                <h3>2.1. Забезпечення роботи Сайту</h3>
                <p>Ваші дані використовуються для:</p>
                <ul>
                  <li>Реєстрації та управління вашим акаунтом</li>
                  <li>Надання доступу до функцій Сайту</li>
                  <li>Обробки ваших прогнозів</li>
                </ul>
                <h3>2.2. Покращення Сайту</h3>
                <p>Ми можемо використовувати зібрані дані для аналізу та покращення функціонування Сайту.</p>
                <h3>2.3. Комунікація з користувачами</h3>
                <p>
                  Ми можемо використовувати вашу електронну адресу для надсилання важливої інформації про ваш акаунт,
                  оновлення та новини Сайту.
                </p>
                <h2>3. Зберігання та захист даних</h2>
                <h3>3.1. Зберігання даних</h3>
                <p>Ваші дані зберігаються на наших серверах та захищені відповідно до стандартних заходів безпеки.</p>
                <h3>3.2. Захист даних</h3>
                <p>
                  Ми вживаємо технічних та організаційних заходів для захисту ваших персональних даних від
                  несанкціонованого доступу, втрати або розкриття.
                </p>
                <h2>4. Права користувачів</h2>
                <h3>4.1. Доступ до даних</h3>
                <p>Ви маєте право на доступ до своїх персональних даних, які ми зберігаємо.</p>
                <h3>4.2. Виправлення даних</h3>
                <p>Ви маєте право на виправлення ваших персональних даних, якщо вони є неточними або неповними.</p>
                <h3>4.3. Видалення даних</h3>
                <p>
                  Ви маєте право вимагати видалення ваших персональних даних, за винятком випадків, коли їх збереження є
                  необхідним для виконання законодавчих вимог.
                </p>
                <h2>5. Передача даних третім сторонам</h2>
                <h3>5.1. Відсутність комерційної передачі</h3>
                <p>
                  Ми не продаємо, не передаємо та не обмінюємо ваші персональні дані третім сторонам з комерційною
                  метою.
                </p>
                <h3>5.2. Випадки передачі даних</h3>
                <p>
                  Ми можемо передавати ваші дані тільки у випадках, коли це необхідно для надання наших послуг або коли
                  це вимагається законом.
                </p>
                <h2>6. Файли cookie</h2>
                <h3>6.1. Використання файлів cookie</h3>
                <p>
                  Ми використовуємо файли cookie для покращення вашого досвіду на Сайті, зберігання налаштувань та
                  аналізу трафіку.
                </p>
                <h3>6.2. Управління файлами cookie</h3>
                <p>
                  Ви можете налаштувати свій браузер для відмови від прийому файлів cookie або повідомлення вас про їх
                  надходження.
                </p>
                <h2>7. Зміни до Політики конфіденційності</h2>
                <p>
                  Ми залишаємо за собою право змінювати цю Політику конфіденційності в будь-який час. Усі зміни будуть
                  опубліковані на цій сторінці. Ми рекомендуємо регулярно переглядати цю сторінку для ознайомлення з
                  актуальною версією Політики конфіденційності.
                </p>
                <h2>8. Контактна інформація</h2>
                <p>
                  Якщо у вас виникли питання або занепокоєння щодо цієї Політики конфіденційності, будь ласка,
                  зв'яжіться з нами за електронною адресою:{' '}
                  <a href="mailto:amerovdavid@gmail.com">amerovdavid@gmail.com</a>.
                </p>
                <p>Дата останнього оновлення: [07.06.2024]</p>
              </div>
            </TabPanel>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default User;
