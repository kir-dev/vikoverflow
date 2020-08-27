import { useSWRInfinite } from "swr";
import Question from "components/question";
import Layout from "components/layout";
import styles from "styles/pages/index.module.css";
import Input from "components/input";
import { useState, useEffect } from "react";
import TopicsSidebarBox from "components/home/topics";
import useDebounce from "lib/use-debounce";
import { useInView } from "react-intersection-observer";

const HomePage = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const { data, size, setSize } = useSWRInfinite((index, prevData) => {
    if (prevData && !prevData.nextCursor) return null;

    if (index === 0)
      return `/api/questions${
        search && debouncedSearch ? `?search=${debouncedSearch}` : ""
      }`;

    return `/api/questions?cursor=${prevData.nextCursor}&cursor2=${
      prevData.nextCursor2
    }${search && debouncedSearch ? `&search=${debouncedSearch}` : ""}`;
  });

  const [loaderRef, inView] = useInView({ rootMargin: "400px 0px" });

  const isErrored = data?.some((p) => !!p.error);
  const isReachingEnd = data && !data[data.length - 1]?.nextCursor;
  const questions =
    data && !isErrored
      ? [].concat(...data.map((page) => page.questions))
      : null;

  useEffect(() => {
    if (inView && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [inView, isReachingEnd]);

  return (
    <>
      <Layout footer={false}>
        <div className={styles.root}>
          <div className={styles.sidebarWrapper}>
            <aside className={styles.sidebar}>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Keresés..."
                aria-label="Keresés"
                type="search"
                className={styles.searchInput}
                prefix={
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  >
                    <path d="M11 17.25a6.25 6.25 0 110-12.5 6.25 6.25 0 010 12.5z" />
                    <path d="M16 16l4.5 4.5" />
                  </svg>
                }
              />
              <TopicsSidebarBox search={search && debouncedSearch} />
            </aside>
          </div>

          {isErrored ? (
            <div className={styles.empty}>
              <h1>Hiba lépett fel</h1>
            </div>
          ) : !questions ? (
            <div className={styles.questionList}>
              <Question skeleton />
              <Question skeleton />
              <Question skeleton />
              <Question skeleton />
              <Question skeleton />
            </div>
          ) : questions.length > 0 ? (
            <div className={styles.questionList}>
              {questions.map((q) => (
                <Question shortBody key={q.id} {...q} />
              ))}
              {!isReachingEnd && <Question ref={loaderRef} skeleton />}
            </div>
          ) : (
            <div className={styles.empty}>
              <h1>Nem találtunk kérdéseket</h1>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default HomePage;
