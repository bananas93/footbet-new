import React, { useState, useEffect, useRef } from 'react';
import cn from 'classnames';
import Button from 'components/Button/Button';
import styles from './OTPInput.module.scss';

interface Props {
  otp: string[];
  setOtp: React.Dispatch<React.SetStateAction<string[]>>;
  codeLength: number;
  isError?: boolean;
  error?: string;
  timerDuration?: number;
  resendCode: () => Promise<void>;
}

const OTPInput = ({ otp, setOtp, codeLength, timerDuration, resendCode, isError, error }: Props) => {
  const [timer, setTimer] = useState(timerDuration || 60);

  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleInputChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < codeLength - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index] === '') {
        if (index > 0) {
          inputRefs.current[index - 1].focus();
        }
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        if (index > 0) {
          inputRefs.current[index - 1].focus();
        }
      }
    }
  };

  const handleResendCode = async () => {
    setOtp(new Array(codeLength).fill(''));
    inputRefs.current[0].focus();
    await resendCode();
    setTimer(timerDuration || 60);
  };

  return (
    <>
      <div className={styles.otpContainer}>
        {otp.map((digit, index) => (
          <input
            autoFocus={index === 0}
            key={index}
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyPress(e, index)}
            ref={(el) => (inputRefs.current[index] = el!)}
            className={cn(styles.input, { [styles.error]: isError })}
          />
        ))}
      </div>
      {isError && <p className={styles.error}>{error}</p>}
      <div className={styles.timerContainer}>
        <p className={styles.timerText}>{`0:${timer < 10 ? `0${timer}` : timer}`}</p>
        <Button variant="link" onClick={handleResendCode} disabled={timer > 0}>
          Надіслати ще раз
        </Button>
      </div>
    </>
  );
};

export default OTPInput;
