import styles from "./label.module.css";

export default function Label({ value, children }) {
  return (
    <label>
      <div className={styles.root}>{value}</div>
      {children}
    </label>
  );
}
