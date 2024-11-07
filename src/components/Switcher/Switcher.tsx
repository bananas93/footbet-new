import cn from 'classnames';
import styles from './Switcher.module.scss';

interface Props {
  label?: string;
  value: boolean;
  onChange: () => void;
  className?: string;
}

const Switcher = ({ label, value, onChange, className }: Props) => {
  return (
    <div className={cn(styles.container, { [className || '']: className })}>
      {label && <span className={styles.label}>{label}</span>}
      <label className={styles.switch}>
        <input type="checkbox" checked={value} onChange={onChange} />
        <span className={styles.slider}></span>
      </label>
    </div>
  );
};

export default Switcher;
