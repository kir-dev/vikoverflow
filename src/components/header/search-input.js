import styles from "./search-input.module.css";
import { Search } from "components/icons";
import { useSearch } from "lib/search-context";
import Button, { KIND } from "components/button";
import { X } from "components/icons";
import cn from "clsx";
import { useState } from "react";

export default function SearchInput() {
  const { search, setSearch } = useSearch();
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={cn(styles.root, {
        [styles.focused]: focused || Boolean(search),
      })}
    >
      <Search />
      <input
        value={search}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.input}
        placeholder="Keresés"
      />
      {search && (
        <Button onClick={() => setSearch("")} kind={KIND.icon}>
          <X />
        </Button>
      )}
    </div>
  );
}
