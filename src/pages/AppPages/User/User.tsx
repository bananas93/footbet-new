import { useEffect, useState } from 'react';
import cn from 'classnames';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { TextInput } from 'components';
import { useForm } from 'hooks';
import {
  clearPushSubscription,
  enablePushSubscription,
  getPushPermissionState,
  getPushSupportState,
  getUserDisplayName,
  getUserInitials,
  hasActivePushSubscription,
  notify,
  resolveAssetUrl,
} from 'helpers';
import { useAppDispatch, useAppSelector } from 'store';
import { changeUserPassword, deleteUserAccount, editUserProfile } from 'store/slices/user';
import { signOutUser } from 'store/slices/auth';
import styles from './User.module.scss';

const validationRules = {
  name: (value: string) => {
    if (!value) return "Потрібно вказати ім'я";
    return '';
  },
};

const changePassValidationRules = {
  oldPassword: (value: string) => {
    if (!value) return 'Потрібно вказати пароль';
    return '';
  },
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

interface FormValues {
  name: string;
  nickname: string;
  phone: string;
}

interface ChangePasswordFormValues {
  oldPassword: string;
  password: string;
  confirmPassword: string;
}

const iconProps = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const UserIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 19.5c.9-3.4 3.7-5.2 7.2-5.2s6.3 1.8 7.2 5.2" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <rect x="4.5" y="10" width="15" height="9.5" rx="2.5" />
    <path d="M8.2 10V7.8a3.8 3.8 0 0 1 7.6 0V10" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M12 3.5 19 6v5.4c0 4.1-2.8 7.5-7 9.1-4.2-1.6-7-5-7-9.1V6l7-2.5Z" />
    <path d="m9 12 2.2 2.2L15.2 10" />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M14.5 8.2V6.5A2 2 0 0 0 12.5 4.5h-5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-1.7" />
    <path d="M10.5 12h9M16.8 8.8 20 12l-3.2 3.2" />
  </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
  </svg>
);

const TagIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M4.5 11.4V5.5a1 1 0 0 1 1-1h5.9a1 1 0 0 1 .7.3l7 7a1 1 0 0 1 0 1.4l-5.9 5.9a1 1 0 0 1-1.4 0l-7-7a1 1 0 0 1-.3-.7Z" />
    <circle cx="8.6" cy="8.6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M15.7 12h-3.8" />
    <path d="M10.8 8.9a3.7 3.7 0 1 0 0 6.2" />
    <path d="M15.7 12a3.7 3.7 0 0 1-4.9 3.5" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M12 4.5a4.2 4.2 0 0 0-4.2 4.2v1.8c0 1.8-.7 3.5-1.9 4.9l-.4.4h12.9l-.4-.4a7.4 7.4 0 0 1-1.9-4.9V8.7A4.2 4.2 0 0 0 12 4.5Z" />
    <path d="M10.2 18a2 2 0 0 0 3.6 0" />
  </svg>
);

const UserSkeleton = () => (
  <div className={styles.page}>
    <span className={cn(styles.skeletonBlock, styles.skeletonHero)} />
    <div className={styles.skeletonLayout}>
      <span className={cn(styles.skeletonBlock, styles.skeletonNav)} />
      <span className={cn(styles.skeletonBlock, styles.skeletonPanel)} />
    </div>
  </div>
);

const User: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  const { isLoading } = useAppSelector((state) => state.user.editUserProfileRequest);
  const { isLoading: isPasswordLoading } = useAppSelector((state) => state.user.changeUserPasswordRequest);
  const isDeleteLoading = useAppSelector((state) => state.user.deleteUserAccountRequest?.isLoading || false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [pushSupport, setPushSupport] = useState<'supported' | 'unsupported' | 'insecure'>('unsupported');

  const handleSaveProfile = async (formValues: FormValues) => {
    try {
      await dispatch(editUserProfile({ ...formValues, avatarFile })).unwrap();
      setAvatarFile(null);
      notify.success('Профіль збережено');
    } catch (err: any) {
      notify.error(err.message);
    }
  };

  const { values, errors, handleChange, handleSubmit } = useForm<FormValues>(
    {
      name: user?.name || '',
      phone: user?.phone || '',
      nickname: user?.nickname || '',
    },
    validationRules,
    (submittedValues: FormValues) => {
      handleSaveProfile(submittedValues);
    },
  );

  const {
    values: passValues,
    errors: passErrors,
    handleChange: handlePassChange,
    handleSubmit: handlePassSubmit,
    clearForm: clearPassForm,
  } = useForm<ChangePasswordFormValues>(
    {
      oldPassword: '',
      password: '',
      confirmPassword: '',
    },
    changePassValidationRules,
    (submittedValues: ChangePasswordFormValues) => {
      handleChangePassword(submittedValues);
    },
  );

  const handleChangePassword = async (formValues: ChangePasswordFormValues) => {
    try {
      await dispatch(
        changeUserPassword({ oldPassword: formValues.oldPassword, password: formValues.password }),
      ).unwrap();
      notify.success('Пароль змінено');
      clearPassForm();
    } catch (err: any) {
      notify.error(err.message);
    }
  };

  const isFormChanged = () => {
    const formValues = {
      name: values.name,
      nickname: values.nickname,
      phone: values.phone,
    };

    const originalValues = {
      name: user?.name || '',
      nickname: user?.nickname || '',
      phone: user?.phone || '',
    };

    return JSON.stringify(formValues) !== JSON.stringify(originalValues) || !!avatarFile;
  };

  const isChanged = isFormChanged();

  const handleLogout = async () => {
    await dispatch(signOutUser());
    localStorage.removeItem('reduxState');
  };

  const handleDeleteAccount = async () => {
    const firstConfirm = window.confirm('Видалити акаунт назавжди? Цю дію неможливо скасувати.');
    if (!firstConfirm) {
      return;
    }

    const secondConfirm = window.confirm('Підтвердіть ще раз: буде видалено профіль, прогнози та участь у кімнатах.');
    if (!secondConfirm) {
      return;
    }

    try {
      await dispatch(deleteUserAccount()).unwrap();
      localStorage.removeItem('reduxState');
      notify.success('Акаунт видалено');
      try {
        await dispatch(signOutUser()).unwrap();
      } catch {
        // Session can become invalid right after deletion.
      }
    } catch (err: any) {
      notify.error(err.message);
    }
  };

  useEffect(() => {
    document.title = 'Профіль | Footbet';
    return () => {
      document.title = 'Турнір прогнозистів | Footbet';
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const syncPushState = async () => {
      const supportState = getPushSupportState();
      if (!isMounted) {
        return;
      }

      setPushSupport(supportState);
      setPushPermission(getPushPermissionState());

      if (supportState !== 'supported') {
        setIsPushEnabled(false);
        return;
      }

      try {
        const hasSubscription = await hasActivePushSubscription();
        if (isMounted) {
          setIsPushEnabled(hasSubscription);
        }
      } catch {
        if (isMounted) {
          setIsPushEnabled(false);
        }
      }
    };

    void syncPushState();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleEnablePush = async () => {
    if (!user?.id) {
      notify.error('Користувач не авторизований');
      return;
    }

    setIsPushLoading(true);
    try {
      await enablePushSubscription(user.id);
      const hasSubscription = await hasActivePushSubscription();
      setPushPermission(getPushPermissionState());
      setIsPushEnabled(hasSubscription);
      if (hasSubscription) {
        notify.success('Push-сповіщення увімкнено');
      } else {
        notify.info('Дозвіл на сповіщення не надано');
      }
    } catch (err: any) {
      notify.error(err.message || 'Не вдалося увімкнути push-сповіщення');
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleDisablePush = async () => {
    setIsPushLoading(true);
    try {
      await clearPushSubscription();
      setIsPushEnabled(false);
      notify.success('Push-сповіщення вимкнено');
    } catch (err: any) {
      notify.error(err.message || 'Не вдалося вимкнути push-сповіщення');
    } finally {
      setIsPushLoading(false);
    }
  };

  if (!user) {
    return <UserSkeleton />;
  }

  const displayName = getUserDisplayName(user.name, user.nickname);
  const initials = getUserInitials(user.name, user.nickname);
  const avatarUrl = resolveAssetUrl(user.avatar);
  const isGoogleAuth = user.authProvider === 'google';

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroContent}>
          <div className={styles.heroIdentity}>
            <span className={styles.avatar}>{avatarUrl ? <img src={avatarUrl} alt={displayName} /> : initials}</span>
            <div className={styles.heroText}>
              <span className={styles.heroEyebrow}>
                <UserIcon className={styles.heroEyebrowIcon} />
                Мій акаунт
              </span>
              <h1 className={styles.heroTitle}>{displayName}</h1>
              <div className={styles.heroChips}>
                <span className={styles.heroChip}>
                  <MailIcon className={styles.heroChipIcon} />
                  {user.email}
                </span>
                {user.nickname && (
                  <span className={styles.heroChip}>
                    <TagIcon className={styles.heroChipIcon} />
                    {user.nickname}
                  </span>
                )}
                {isGoogleAuth && (
                  <span className={cn(styles.heroChip, styles.googleChip)}>
                    <GoogleIcon className={styles.heroChipIcon} />
                    Вхід через Google
                  </span>
                )}
              </div>
            </div>
          </div>

          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            <LogoutIcon className={styles.buttonIcon} />
            Вийти
          </button>
        </div>
      </section>

      <Tabs className={styles.layout}>
        <TabList className={styles.nav}>
          <Tab className={styles.navItem}>
            <span className={styles.navIcon}>
              <UserIcon />
            </span>
            <span className={styles.navText}>
              <span className={styles.navTitle}>Деталі профілю</span>
              <span className={styles.navMeta}>Імʼя, нікнейм, контакти</span>
            </span>
          </Tab>
          <Tab className={styles.navItem}>
            <span className={styles.navIcon}>
              <LockIcon />
            </span>
            <span className={styles.navText}>
              <span className={styles.navTitle}>{isGoogleAuth ? 'Спосіб входу' : 'Зміна паролю'}</span>
              <span className={styles.navMeta}>{isGoogleAuth ? 'Підключено Google' : 'Безпека акаунта'}</span>
            </span>
          </Tab>
          <Tab className={styles.navItem}>
            <span className={styles.navIcon}>
              <ShieldIcon />
            </span>
            <span className={styles.navText}>
              <span className={styles.navTitle}>Конфіденційність</span>
              <span className={styles.navMeta}>Як ми працюємо з даними</span>
            </span>
          </Tab>
        </TabList>

        <div className={styles.content}>
          <TabPanel className={styles.tabPanel} selectedClassName={styles.tabPanelSelected}>
            <section className={styles.panel}>
              <header className={styles.panelHead}>
                <span className={styles.panelIcon}>
                  <UserIcon />
                </span>
                <div className={styles.panelHeadText}>
                  <h2 className={styles.panelTitle}>Деталі профілю</h2>
                  <p className={styles.panelMeta}>Нікнейм видно іншим гравцям у таблицях та кімнатах</p>
                </div>
              </header>

              <div className={styles.form}>
                <div className={styles.field}>
                  <TextInput name="email" label="Email" value={user.email} disabled />
                  <span className={styles.fieldHint}>Email використовується для входу і не змінюється</span>
                </div>
                <div className={styles.field}>
                  <TextInput
                    name="name"
                    label="Імʼя"
                    onChange={(e) => handleChange('name', e.target.value)}
                    value={values.name}
                    error={errors.name}
                  />
                </div>
                <div className={styles.field}>
                  <TextInput
                    name="nickname"
                    label="Нікнейм"
                    onChange={(e) => handleChange('nickname', e.target.value)}
                    value={values.nickname}
                  />
                  <span className={styles.fieldHint}>Якщо порожній, у таблицях показуємо імʼя</span>
                </div>
                <div className={styles.field}>
                  <TextInput
                    name="phone"
                    label="Телефон"
                    onChange={(e) => handleChange('phone', e.target.value)}
                    value={values.phone}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fileLabel} htmlFor="avatarFile">
                    Аватар
                  </label>
                  <input
                    id="avatarFile"
                    name="avatarFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className={styles.fileInput}
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  />
                  <span className={styles.fieldHint}>
                    {avatarFile
                      ? `Обрано файл: ${avatarFile.name}`
                      : isGoogleAuth
                        ? 'Можна завантажити власний аватар, навіть якщо вхід через Google'
                        : 'Підтримуються PNG, JPG, WEBP, SVG'}
                  </span>
                </div>
              </div>

              <div className={styles.panelFooter}>
                <span className={styles.footerHint}>
                  {isChanged ? 'Є незбережені зміни' : 'Усі зміни збережено'}
                </span>
                <button
                  type="button"
                  className={styles.submit}
                  onClick={handleSubmit}
                  disabled={!isChanged || isLoading}>
                  {isLoading ? 'Збереження...' : 'Зберегти зміни'}
                </button>
              </div>
            </section>
          </TabPanel>

          <TabPanel className={styles.tabPanel} selectedClassName={styles.tabPanelSelected}>
            <section className={styles.panel}>
              <header className={styles.panelHead}>
                <span className={styles.panelIcon}>
                  <LockIcon />
                </span>
                <div className={styles.panelHeadText}>
                  <h2 className={styles.panelTitle}>{isGoogleAuth ? 'Вхід через Google' : 'Зміна паролю'}</h2>
                  <p className={styles.panelMeta}>
                    {isGoogleAuth
                      ? 'Цей акаунт авторизується через Google, тому локальний пароль Footbet не використовується.'
                      : 'Мінімум 8 символів, бажано з цифрами та літерами різного регістру'}
                  </p>
                </div>
              </header>

              {isGoogleAuth ? (
                <div className={styles.providerNotice}>
                  <span className={styles.providerBadge}>
                    <GoogleIcon className={styles.providerBadgeIcon} />
                    Google OAuth
                  </span>
                  <p>
                    Для зміни пароля використовуйте налаштування безпеки Google. Після зміни в Google новий пароль автоматично діятиме і для входу у Footbet через Google.
                  </p>
                  <p className={styles.providerHint}>Email акаунту: {user.email}</p>
                </div>
              ) : (
                <>
                  <div className={cn(styles.form, styles.formNarrow)}>
                    <div className={styles.field}>
                      <TextInput
                        name="oldPassword"
                        label="Поточний пароль"
                        type="password"
                        onChange={(e) => handlePassChange('oldPassword', e.target.value)}
                        value={passValues.oldPassword}
                        error={passErrors.oldPassword}
                      />
                    </div>
                    <div className={styles.field}>
                      <TextInput
                        name="password"
                        label="Новий пароль"
                        type="password"
                        onChange={(e) => handlePassChange('password', e.target.value)}
                        value={passValues.password}
                        error={passErrors.password}
                      />
                    </div>
                    <div className={styles.field}>
                      <TextInput
                        name="confirmPassword"
                        label="Підтвердження нового паролю"
                        type="password"
                        onChange={(e) => handlePassChange('confirmPassword', e.target.value)}
                        value={passValues.confirmPassword}
                        error={passErrors.confirmPassword}
                      />
                    </div>
                  </div>

                  <div className={styles.panelFooter}>
                    <span className={styles.footerHint}>Після зміни паролю сесія залишиться активною</span>
                    <button type="button" className={styles.submit} onClick={handlePassSubmit} disabled={isPasswordLoading}>
                      {isPasswordLoading ? 'Змінюємо...' : 'Змінити пароль'}
                    </button>
                  </div>
                </>
              )}
            </section>
          </TabPanel>

          <TabPanel className={styles.tabPanel} selectedClassName={styles.tabPanelSelected}>
            <section className={styles.panel}>
              <header className={styles.panelHead}>
                <span className={styles.panelIcon}>
                  <ShieldIcon />
                </span>
                <div className={styles.panelHeadText}>
                  <h2 className={styles.panelTitle}>Політика конфіденційності</h2>
                  <p className={styles.panelMeta}>Оновлено 07.06.2024</p>
                </div>
              </header>

              <div className={styles.privacy}>
                <p className={styles.privacyLead}>
                  Ця Політика конфіденційності визначає, як наш вебсайт (footbet.pp.ua) збирає, використовує, зберігає та
                  захищає персональні дані користувачів. Сайт призначений для користувачів, які реєструються та ставлять
                  прогнози на футбольні матчі в рамках некомерційних змагань з іншими гравцями.
                </p>
                <h3>1. Збір інформації</h3>
                <h4>1.1. Персональні дані</h4>
                <p>Ми можемо збирати такі персональні дані:</p>
                <ul>
                  <li>Ім'я</li>
                  <li>Електронна адреса</li>
                  <li>Логін та пароль</li>
                  <li>Інформація про активність на Сайті</li>
                </ul>
                <h4>1.2. Автоматично зібрані дані</h4>
                <p>Ми також можемо автоматично збирати такі дані:</p>
                <ul>
                  <li>IP-адреса</li>
                  <li>Тип браузера</li>
                  <li>Час доступу та сторінки, які ви переглядаєте</li>
                </ul>
                <h3>2. Використання зібраної інформації</h3>
                <h4>2.1. Забезпечення роботи Сайту</h4>
                <p>Ваші дані використовуються для:</p>
                <ul>
                  <li>Реєстрації та управління вашим акаунтом</li>
                  <li>Надання доступу до функцій Сайту</li>
                  <li>Обробки ваших прогнозів</li>
                </ul>
                <h4>2.2. Покращення Сайту</h4>
                <p>Ми можемо використовувати зібрані дані для аналізу та покращення функціонування Сайту.</p>
                <h4>2.3. Комунікація з користувачами</h4>
                <p>
                  Ми можемо використовувати вашу електронну адресу для надсилання важливої інформації про ваш акаунт,
                  оновлення та новини Сайту.
                </p>
                <h3>3. Зберігання та захист даних</h3>
                <h4>3.1. Зберігання даних</h4>
                <p>Ваші дані зберігаються на наших серверах та захищені відповідно до стандартних заходів безпеки.</p>
                <h4>3.2. Захист даних</h4>
                <p>
                  Ми вживаємо технічних та організаційних заходів для захисту ваших персональних даних від
                  несанкціонованого доступу, втрати або розкриття.
                </p>
                <h3>4. Права користувачів</h3>
                <h4>4.1. Доступ до даних</h4>
                <p>Ви маєте право на доступ до своїх персональних даних, які ми зберігаємо.</p>
                <h4>4.2. Виправлення даних</h4>
                <p>Ви маєте право на виправлення ваших персональних даних, якщо вони є неточними або неповними.</p>
                <h4>4.3. Видалення даних</h4>
                <p>
                  Ви маєте право вимагати видалення ваших персональних даних, за винятком випадків, коли їх збереження є
                  необхідним для виконання законодавчих вимог.
                </p>
                <h3>5. Передача даних третім сторонам</h3>
                <h4>5.1. Відсутність комерційної передачі</h4>
                <p>
                  Ми не продаємо, не передаємо та не обмінюємо ваші персональні дані третім сторонам з комерційною метою.
                </p>
                <h4>5.2. Випадки передачі даних</h4>
                <p>
                  Ми можемо передавати ваші дані тільки у випадках, коли це необхідно для надання наших послуг або коли
                  це вимагається законом.
                </p>
                <h3>6. Файли cookie</h3>
                <h4>6.1. Використання файлів cookie</h4>
                <p>
                  Ми використовуємо файли cookie для покращення вашого досвіду на Сайті, зберігання налаштувань та
                  аналізу трафіку.
                </p>
                <h4>6.2. Управління файлами cookie</h4>
                <p>
                  Ви можете налаштувати свій браузер для відмови від прийому файлів cookie або повідомлення вас про їх
                  надходження.
                </p>
                <h3>7. Зміни до Політики конфіденційності</h3>
                <p>
                  Ми залишаємо за собою право змінювати цю Політику конфіденційності в будь-який час. Усі зміни будуть
                  опубліковані на цій сторінці. Ми рекомендуємо регулярно переглядати цю сторінку для ознайомлення з
                  актуальною версією Політики конфіденційності.
                </p>

                <div className={styles.pushZone}>
                  <h3>
                    <BellIcon className={styles.pushIcon} />
                    Push-сповіщення
                  </h3>
                  <p>
                    Отримуйте миттєві повідомлення про важливі оновлення матчів і турнірів у браузері.
                  </p>
                  <p className={styles.pushStatus}>
                    Статус:{' '}
                    {pushSupport === 'insecure'
                      ? 'Недоступно (потрібен HTTPS)'
                      : pushSupport === 'unsupported'
                        ? 'Не підтримується цим браузером'
                        : isPushEnabled
                          ? 'Увімкнено'
                          : pushPermission === 'denied'
                            ? 'Вимкнено в налаштуваннях браузера'
                            : 'Вимкнено'}
                  </p>
                  <div className={styles.pushActions}>
                    <button
                      type="button"
                      className={styles.pushButton}
                      onClick={handleEnablePush}
                      disabled={isPushLoading || pushSupport !== 'supported'}>
                      {isPushLoading ? 'Застосовуємо...' : 'Увімкнути push'}
                    </button>
                    <button
                      type="button"
                      className={cn(styles.pushButton, styles.pushButtonSecondary)}
                      onClick={handleDisablePush}
                      disabled={isPushLoading || !isPushEnabled}>
                      Вимкнути push
                    </button>
                  </div>
                </div>

                <h3>8. Контактна інформація</h3>
                <p>
                  Якщо у вас виникли питання або занепокоєння щодо цієї Політики конфіденційності, будь ласка, зв'яжіться
                  з нами за електронною адресою: <a href="mailto:amerovdavid@gmail.com">amerovdavid@gmail.com</a>.
                </p>

                <div className={styles.dangerZone}>
                  <h3>Видалення акаунта</h3>
                  <p>
                    Після видалення акаунта всі ваші персональні дані, прогнози та членство в кімнатах будуть безповоротно
                    видалені.
                  </p>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={handleDeleteAccount}
                    disabled={isDeleteLoading}>
                    {isDeleteLoading ? 'Видаляємо акаунт...' : 'Видалити акаунт'}
                  </button>
                </div>
              </div>
            </section>
          </TabPanel>
        </div>
      </Tabs>
    </div>
  );
};

export default User;
