import _Tooltip from "@reach/tooltip";
import styles from "./tooltip.module.css";

export default function Tooltip(props) {
  return <_Tooltip {...props} className={styles.root} />;
}
