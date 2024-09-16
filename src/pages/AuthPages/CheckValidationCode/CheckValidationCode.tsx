import { Button } from 'components';
import OTPInput from 'components/OTPInput/OTPInput';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'store';
import { checkVerificationCode, resetPassword } from 'store/slices/auth';
import styles from './CheckValidationCode.module.scss';
import { AuthRoutesEnum } from 'routes/AuthRoutes';
import { notify } from 'helpers';

const CheckValidationCode = () => {
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
    <div className={styles.login}>
      <h1 className={styles.loginTitle}>Введіть код підтвердження</h1>
      <p className={styles.loginSubtitle}>
        Посилання для відновлення паролю відправлено на <b>{email}</b>
      </p>
      <div className={styles.loginForm}>
        <OTPInput
          otp={otp}
          setOtp={setOtp}
          codeLength={6}
          resendCode={resendCode}
          isError={isError}
          error={error as string}
        />
        <Button variant="primary" onClick={handleVerification} loading={isLoading} disabled={buttonDisabled}>
          Продовжити
        </Button>
      </div>
    </div>
  );
};

export default CheckValidationCode;
