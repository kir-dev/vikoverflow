import styles from "./error.module.css";

export default function Error({ children }) {
  return <span className={styles.root}>{children}</span>;
}
