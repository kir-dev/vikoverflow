import styles from "./search-list.module.css";
import { useState } from "react";
import Tabs from "components/tabs";
import useSWR from "swr";
import { useRouter } from "next/router";
import { useSearch } from "lib/search-context";
import { useDebounce } from "use-debounce";

function Result(props) {
  const router = useRouter();

  switch (props.type) {
    case "question":
      return (
        <div
          className={styles.result}
          onClick={() => router.push(`/kerdes/${props.id}`)}
        >
          {props.title}
        </div>
      );
    case "answer":
      return (
        <div
          className={styles.result}
          onClick={() => router.push(`/kerdes/${props.questionId}`)}
        >
          {props.body}
        </div>
      );
    case "topic":
      return (
        <div
          className={styles.result}
          onClick={() => router.push(`/tema/${props.id}`)}
        >
          {props.id}
        </div>
      );
    case "user":
      return (
        <div
          className={styles.result}
          onClick={() => router.push(`/profil/${props.id}`)}
        >
          {props.name}
        </div>
      );
  }
}

export default function SearchList() {
  const { search } = useSearch();
  const [debouncedSearch] = useDebounce(search, 300, {
    maxWait: 500,
  });
  const { data } = useSWR(
    search && debouncedSearch ? `/api/search?q=${debouncedSearch}` : null
  );
  const [selected, setSelected] = useState("all");

  const results = data
    ? selected === "all"
      ? data.results
      : data.results.filter((e) => e.type === selected)
    : null;

  return (
    <div className={styles.root}>
      <Tabs
        tabs={[
          { title: "Minden", value: "all" },
          { title: "Kérdés", value: "question" },
          { title: "Válasz", value: "answer" },
          { title: "Téma", value: "topic" },
          { title: "Felhasználó", value: "user" },
        ]}
        selected={selected}
        setSelected={setSelected}
      />

      {results && search === debouncedSearch && (
        <div className={styles.results}>
          {results.length ? (
            results.map((r, n) => <Result {...r} key={n} />)
          ) : (
            <div className={styles.empty}>
              <p>
                Nincs találat a <b>"{search}"</b> kulcsszóra, próbálkozz valami
                mással.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
