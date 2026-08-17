import OTPInput from 'components/OTPInput/OTPInput';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'store';
import { checkVerificationCode, resetPassword } from 'store/slices/auth';
import styles from './CheckValidationCode.module.scss';
import { AuthRoutesEnum } from 'routes/AuthRoutes';
import { notify } from 'helpers';
import { useI18n } from 'i18n';

const CheckValidationCode = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { state: email } = useLocation();

  const dispatch = useAppDispatch();
  const { isLoading, isError, error } = useAppSelector((state) => state.auth.checkVerificationCodeRequest);
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));

  if (!email) {
    return <Navigate to={AuthRoutesEnum.SignIn} />;
  }

  const resendCode = async () => {
    try {
      await dispatch(resetPassword({ email })).unwrap();
      navigate(AuthRoutesEnum.CheckCode, { state: email });
    } catch (error: any) {
      notify.error(error.message);
    }
  };

  const handleVerification = async () => {
    try {
      const code = otp.join('');
      await dispatch(checkVerificationCode({ email, code })).unwrap();

      navigate(AuthRoutesEnum.SetPassword, { state: { email, code } });
    } catch (error: any) {
      notify.error(error.message);
    }
  };

  const buttonDisabled = otp.some((code) => code === '');

  return (
    <div className={styles.auth}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>{t('auth.checkCode.eyebrow')}</span>
        <h1 className={styles.title}>{t('auth.checkCode.title')}</h1>
        <p className={styles.subtitle}>
          {t('auth.checkCode.subtitle')} <span className={styles.email}>{email}</span>
        </p>
      </header>

      <div className={styles.otp}>
        <OTPInput
          otp={otp}
          setOtp={setOtp}
          codeLength={6}
          resendCode={resendCode}
          isError={isError}
          error={error as string}
        />
      </div>

      <button
        type="button"
        className={styles.submit}
        onClick={handleVerification}
        disabled={buttonDisabled || isLoading}>
        {isLoading ? t('otp.continueLoading') : t('otp.continue')}
      </button>

      <p className={styles.footer}>
        <Link to={AuthRoutesEnum.SignIn} className={styles.footerLink}>
          {t('auth.common.backToSignIn')}
        </Link>
      </p>
    </div>
  );
};

export default CheckValidationCode;
