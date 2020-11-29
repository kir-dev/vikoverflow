import styles from "./search-list.module.css";
import { useState } from "react";
import Tabs from "components/tabs";
import { useRouter } from "next/router";
import { useSearch } from "lib/search-context";
import useSWRSearch from "swr/use-search";
import cn from "clsx";
import { Question, Comment, User, Topic } from "components/icons";

function Result(props) {
  const router = useRouter();

  switch (props.type) {
    case "question":
      return (
        <div
          className={styles.result}
          onClick={() => router.push(`/kerdes/${props.id}`)}
        >
          <Question />
          {props.title}
        </div>
      );
    case "answer":
      return (
        <div
          className={styles.result}
          onClick={() => router.push(`/kerdes/${props.questionId}`)}
        >
          <Comment />
          {props.body}
        </div>
      );
    case "topic":
      return (
        <div
          className={styles.result}
          onClick={() => router.push(`/tema/${props.id}`)}
        >
          <Topic />
          {props.id}
        </div>
      );
    case "user":
      return (
        <div
          className={styles.result}
          onClick={() => router.push(`/profil/${props.id}`)}
        >
          <User />
          {props.name}
        </div>
      );
  }
}

export default function SearchList() {
  const { debouncedSearch: search } = useSearch();
  const [selected, setSelected] = useState("all");
  const {
    results,
    initialDataLoaded,
    isEmpty,
    isReachingEnd,
    isLoadingMore,
    loadMore,
  } = useSWRSearch(search, selected);

  return (
    <div className={styles.root}>
      <div className={styles.tabsContainer}>
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
      </div>

      {initialDataLoaded && (
        <div className={styles.results}>
          {!isEmpty ? (
            results.map((r, n) => <Result {...r} key={n} />)
          ) : (
            <div className={styles.empty}>
              <p>
                Nincs találat a <b>"{search}"</b> kulcsszóra, próbálkozz valami
                mással.
              </p>
            </div>
          )}
          {!isReachingEnd && (
            <span
              onClick={!isLoadingMore && loadMore}
              className={cn(styles.loadMore, {
                [styles.loading]: isLoadingMore,
              })}
            >
              Továbbiak betöltése...
            </span>
          )}
        </div>
      )}
    </div>
  );
}
