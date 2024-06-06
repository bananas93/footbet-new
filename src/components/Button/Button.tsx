import React from 'react';
import cn from 'classnames';
import styles from './Button.module.scss';
import { Link } from 'react-router-dom';

interface Props {
  variant?: 'primary' | 'secondary' | 'link';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
  children: React.ReactNode;
}

const Button: React.FC<Props> = ({ variant = 'primary', href, disabled, loading, onClick, className, children }) => {
  if (href) {
    return (
      <Link to={href} className={cn(styles.button, styles.link)}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(styles.button, {
        [styles.primary]: variant === 'primary',
        [styles.secondary]: variant === 'secondary',
        [styles.link]: variant === 'link',
        [styles.loading]: loading,
        [className || '']: true,
      })}>
      {children}
    </button>
  );
};

export default Button;
