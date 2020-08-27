import { AlertCircle } from "react-feather";
import styles from "./error.module.css";

const Error = ({ children }) => (
  <span className={styles.root}>
    <AlertCircle size={12} />
    {children}
  </span>
);

export default Error;
