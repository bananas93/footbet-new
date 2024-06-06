import cn from 'classnames';
import styles from './TextInput.module.scss';

export interface Props {
  name: string;
  label?: string;
  placeholder: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number';
  value: string;
  pattern?: string;
  autoFocus?: boolean;
  maxLength?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  clearError?: () => void;
  disabled?: boolean;
}

const TextInput: React.FC<Props> = ({
  name,
  label,
  placeholder,
  autoFocus,
  type = 'text',
  value,
  pattern,
  onChange,
  error,
  maxLength,
  clearError,
  disabled,
}) => {
  const handleFocus = () => {
    if (error && clearError) {
      clearError();
    }
  };

  return (
    <div>
      {label && (
        <label className={styles.inputLabel} htmlFor={name}>
          {label}
        </label>
      )}
      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onFocus={handleFocus}
        autoFocus={autoFocus}
        pattern={pattern}
        maxLength={maxLength}
        className={cn(styles.input, { [styles.error]: !!error })}
        disabled={disabled}
      />
      {error && <span className={styles.inputError}>{error}</span>}
    </div>
  );
};

export default TextInput;
