import styles from "./toggle.module.css";
import cn from "clsx";

const Toggle = ({ active }) => (
  <div className={cn(styles.root, { [styles.active]: active })}>
    <div className={styles.top} />
    <div className={styles.bottom} />
  </div>
);

export default Toggle;
