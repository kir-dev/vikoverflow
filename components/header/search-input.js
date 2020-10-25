import styles from "./search-input.module.css";
import { Search } from "components/icons";

export default function SearchInput() {
  return (
    <div className={styles.root}>
      <Search />
      <input className={styles.input} placeholder="Keresés" />
    </div>
  );
}
