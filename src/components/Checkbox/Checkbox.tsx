import { ChangeEvent, FC } from 'react';
import cn from 'classnames';
import styles from './Checkbox.module.scss';

interface Props {
  id?: string;
  name?: string;
  checked: boolean;
  isDisabled?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}

const Checkbox: FC<Props> = ({ id, name, checked, isDisabled, onChange, label }) => (
  <label
    className={cn(styles.checkbox, {
      [styles.disabled]: isDisabled,
    })}
    id={id}>
    <div className={styles.checkboxBlock}>
      <input type="checkbox" name={name} className={styles.checkboxInput} checked={checked} onChange={onChange} />
      <span className={cn(styles.checkboxWrapper, { [styles.checked]: checked })}>
        <svg className={styles.checkboxWrapperIcon} viewBox="0 0 20 20">
          <polyline points="4 11 8 15 16 6" />
        </svg>
      </span>
    </div>
    {label && <span className={styles.checkboxLabel}>{label}</span>}
  </label>
);
export default Checkbox;
