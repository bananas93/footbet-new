import cn from 'classnames';
import styles from './Card.module.scss';

interface CardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, title }) => {
  return (
    <div className={cn(styles.card, { [className ? className : '']: className })}>
      {title && <h5 className={styles.cardTitle}>{title}</h5>}
      <div className={styles.cardChildren}>{children}</div>
    </div>
  );
};

export default Card;
