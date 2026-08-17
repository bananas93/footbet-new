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
  trackEvent,
} from 'helpers';
import { useAppDispatch, useAppSelector } from 'store';
import { changeUserPassword, deleteUserAccount, editUserProfile } from 'store/slices/user';
import { signOutUser } from 'store/slices/auth';
import styles from './User.module.scss';
import { useI18n } from 'i18n';

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

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx="12" cy="12" r="2.8" />
    <path d="M12 5.2v1.6M12 17.2v1.6M5.2 12h1.6M17.2 12h1.6" />
    <path d="m7.2 7.2 1.1 1.1M15.7 15.7l1.1 1.1M16.8 7.2l-1.1 1.1M8.3 15.7l-1.1 1.1" />
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
  const { t } = useI18n();
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

  const validationRules = {
    name: (value: string) => {
      if (!value) return t('auth.signUp.nameRequired');
      return '';
    },
  };

  const changePassValidationRules = {
    oldPassword: (value: string) => {
      if (!value) return t('auth.common.passwordRequired');
      return '';
    },
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

  const handleSaveProfile = async (formValues: FormValues) => {
    try {
      await dispatch(editUserProfile({ ...formValues, avatarFile })).unwrap();
      setAvatarFile(null);
      notify.success(t('pages.user.profileSaved'));
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
      notify.success(t('pages.user.passwordChanged'));
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
    const firstConfirm = window.confirm(t('pages.user.deleteConfirm1'));
    if (!firstConfirm) {
      return;
    }

    const secondConfirm = window.confirm(t('pages.user.deleteConfirm2'));
    if (!secondConfirm) {
      return;
    }

    try {
      await dispatch(deleteUserAccount()).unwrap();
      localStorage.removeItem('reduxState');
      notify.success(t('pages.user.accountDeleted'));
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
    document.title = t('app.routes.user');
    return () => {
      document.title = t('app.defaultTitle');
    };
  }, [t]);

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
      notify.error(t('errors.user.notAuthorized'));
      return;
    }

    setIsPushLoading(true);
    try {
      await enablePushSubscription(user.id);
      const hasSubscription = await hasActivePushSubscription();
      setPushPermission(getPushPermissionState());
      setIsPushEnabled(hasSubscription);
      if (hasSubscription) {
        trackEvent('push_enabled', { source: 'user_settings' });
        notify.success(t('pages.user.pushEnabled'));
      } else {
        notify.info(t('pages.user.pushPermissionMissing'));
      }
    } catch (err: any) {
      notify.error(err.message || t('pages.user.pushEnableError'));
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleDisablePush = async () => {
    setIsPushLoading(true);
    try {
      await clearPushSubscription();
      setIsPushEnabled(false);
      trackEvent('push_disabled', { source: 'user_settings' });
      notify.success(t('pages.user.pushDisabled'));
    } catch (err: any) {
      notify.error(err.message || t('pages.user.pushDisableError'));
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
                {t('pages.user.hero')}
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
                    {t('pages.user.googleLogin')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            <LogoutIcon className={styles.buttonIcon} />
            {t('pages.user.logout')}
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
              <span className={styles.navTitle}>{t('pages.user.nav.profileTitle')}</span>
              <span className={styles.navMeta}>{t('pages.user.nav.profileMeta')}</span>
            </span>
          </Tab>
          <Tab className={styles.navItem}>
            <span className={styles.navIcon}>
              <LockIcon />
            </span>
            <span className={styles.navText}>
              <span className={styles.navTitle}>
                {isGoogleAuth ? t('pages.user.nav.authMethod') : t('pages.user.nav.changePassword')}
              </span>
              <span className={styles.navMeta}>
                {isGoogleAuth ? t('pages.user.nav.googleConnected') : t('pages.user.nav.accountSecurity')}
              </span>
            </span>
          </Tab>
          <Tab className={styles.navItem}>
            <span className={styles.navIcon}>
              <ShieldIcon />
            </span>
            <span className={styles.navText}>
              <span className={styles.navTitle}>{t('pages.user.nav.privacyTitle')}</span>
              <span className={styles.navMeta}>{t('pages.user.nav.privacyMeta')}</span>
            </span>
          </Tab>
          <Tab className={styles.navItem}>
            <span className={styles.navIcon}>
              <SettingsIcon />
            </span>
            <span className={styles.navText}>
              <span className={styles.navTitle}>{t('pages.user.nav.settingsTitle')}</span>
              <span className={styles.navMeta}>{t('pages.user.nav.settingsMeta')}</span>
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
                  <h2 className={styles.panelTitle}>{t('pages.user.profile.title')}</h2>
                  <p className={styles.panelMeta}>{t('pages.user.profile.meta')}</p>
                </div>
              </header>

              <div className={styles.form}>
                <div className={styles.field}>
                  <TextInput name="email" label={t('auth.common.emailLabel')} value={user.email} disabled />
                  <span className={styles.fieldHint}>{t('pages.user.profile.emailHint')}</span>
                </div>
                <div className={styles.field}>
                  <TextInput
                    name="name"
                    label={t('pages.user.profile.name')}
                    onChange={(e) => handleChange('name', e.target.value)}
                    value={values.name}
                    error={errors.name}
                  />
                </div>
                <div className={styles.field}>
                  <TextInput
                    name="nickname"
                    label={t('pages.user.profile.nickname')}
                    onChange={(e) => handleChange('nickname', e.target.value)}
                    value={values.nickname}
                  />
                  <span className={styles.fieldHint}>{t('pages.user.profile.nicknameHint')}</span>
                </div>
                <div className={styles.field}>
                  <TextInput
                    name="phone"
                    label={t('pages.user.profile.phone')}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    value={values.phone}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fileLabel} htmlFor="avatarFile">
                    {t('pages.user.profile.avatar')}
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
                      ? t('pages.user.profile.fileSelected', undefined, { name: avatarFile.name })
                      : isGoogleAuth
                        ? t('pages.user.profile.avatarGoogle')
                        : t('pages.user.profile.avatarFormats')}
                  </span>
                </div>
              </div>

              <div className={styles.panelFooter}>
                <span className={styles.footerHint}>
                  {isChanged ? t('pages.user.profile.unsaved') : t('pages.user.profile.saved')}
                </span>
                <button
                  type="button"
                  className={styles.submit}
                  onClick={handleSubmit}
                  disabled={!isChanged || isLoading}>
                  {isLoading ? t('pages.user.profile.saving') : t('pages.user.profile.save')}
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
                  <h2 className={styles.panelTitle}>
                    {isGoogleAuth ? t('pages.user.security.googleTitle') : t('pages.user.security.passwordTitle')}
                  </h2>
                  <p className={styles.panelMeta}>
                    {isGoogleAuth ? t('pages.user.security.googleMeta') : t('pages.user.security.passwordMeta')}
                  </p>
                </div>
              </header>

              {isGoogleAuth ? (
                <div className={styles.providerNotice}>
                  <span className={styles.providerBadge}>
                    <GoogleIcon className={styles.providerBadgeIcon} />
                    Google OAuth
                  </span>
                  <p>{t('pages.user.security.googleHint')}</p>
                  <p className={styles.providerHint}>
                    {t('pages.user.security.emailLabel', undefined, { email: user.email })}
                  </p>
                </div>
              ) : (
                <>
                  <div className={cn(styles.form, styles.formNarrow)}>
                    <div className={styles.field}>
                      <TextInput
                        name="oldPassword"
                        label={t('pages.user.security.currentPassword')}
                        type="password"
                        onChange={(e) => handlePassChange('oldPassword', e.target.value)}
                        value={passValues.oldPassword}
                        error={passErrors.oldPassword}
                      />
                    </div>
                    <div className={styles.field}>
                      <TextInput
                        name="password"
                        label={t('pages.user.security.newPassword')}
                        type="password"
                        onChange={(e) => handlePassChange('password', e.target.value)}
                        value={passValues.password}
                        error={passErrors.password}
                      />
                    </div>
                    <div className={styles.field}>
                      <TextInput
                        name="confirmPassword"
                        label={t('pages.user.security.confirmNewPassword')}
                        type="password"
                        onChange={(e) => handlePassChange('confirmPassword', e.target.value)}
                        value={passValues.confirmPassword}
                        error={passErrors.confirmPassword}
                      />
                    </div>
                  </div>

                  <div className={styles.panelFooter}>
                    <span className={styles.footerHint}>{t('pages.user.security.sessionHint')}</span>
                    <button
                      type="button"
                      className={styles.submit}
                      onClick={handlePassSubmit}
                      disabled={isPasswordLoading}>
                      {isPasswordLoading ? t('pages.user.security.changing') : t('pages.user.security.change')}
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
                  <h2 className={styles.panelTitle}>{t('pages.user.privacy.title')}</h2>
                  <p className={styles.panelMeta}>{t('pages.user.privacy.updated')}</p>
                </div>
              </header>

              <div className={styles.privacy} dangerouslySetInnerHTML={{ __html: t('pages.user.privacy.html') }} />
            </section>
          </TabPanel>

          <TabPanel className={styles.tabPanel} selectedClassName={styles.tabPanelSelected}>
            <section className={styles.panel}>
              <header className={styles.panelHead}>
                <span className={styles.panelIcon}>
                  <SettingsIcon />
                </span>
                <div className={styles.panelHeadText}>
                  <h2 className={styles.panelTitle}>{t('pages.user.settings.title')}</h2>
                  <p className={styles.panelMeta}>{t('pages.user.settings.meta')}</p>
                </div>
              </header>

              <div className={styles.privacy}>
                <div className={styles.pushZone}>
                  <h3>
                    <BellIcon className={styles.pushIcon} />
                    {t('pages.user.settings.pushTitle')}
                  </h3>
                  <p>{t('pages.user.settings.pushText')}</p>
                  <p className={styles.pushStatus}>
                    {t('pages.user.settings.status')}{' '}
                    {pushSupport === 'insecure'
                      ? t('pages.user.settings.statusInsecure')
                      : pushSupport === 'unsupported'
                        ? t('pages.user.settings.statusUnsupported')
                        : isPushEnabled
                          ? t('pages.user.settings.statusEnabled')
                          : pushPermission === 'denied'
                            ? t('pages.user.settings.statusDenied')
                            : t('pages.user.settings.statusDisabled')}
                  </p>
                  <div className={styles.pushActions}>
                    <button
                      type="button"
                      className={styles.pushButton}
                      onClick={handleEnablePush}
                      disabled={isPushLoading || pushSupport !== 'supported'}>
                      {isPushLoading ? t('pages.user.settings.applying') : t('pages.user.settings.enablePush')}
                    </button>
                    <button
                      type="button"
                      className={cn(styles.pushButton, styles.pushButtonSecondary)}
                      onClick={handleDisablePush}
                      disabled={isPushLoading || !isPushEnabled}>
                      {t('pages.user.settings.disablePush')}
                    </button>
                  </div>
                </div>

                <div className={styles.dangerZone}>
                  <h3>{t('pages.user.settings.dangerTitle')}</h3>
                  <p>{t('pages.user.settings.dangerText')}</p>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={handleDeleteAccount}
                    disabled={isDeleteLoading}>
                    {isDeleteLoading ? t('pages.user.settings.deleting') : t('pages.user.settings.delete')}
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
