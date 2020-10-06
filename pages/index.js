import { useSWRInfinite } from "swr";
import Question from "components/question";
import Layout from "components/layout";
import styles from "styles/pages/index.module.css";
import Input from "components/input";
import { useState, useEffect } from "react";
import TopicsSidebarBox from "components/home/topics";
import { useDebounce } from "lib/utils";
import { useInView } from "react-intersection-observer";
import Head from "next/head";

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
      <Head>
        <link
          rel="preload"
          href="/api/questions"
          as="fetch"
          crossOrigin="anonymous"
        />
      </Head>

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
                    width="24"
                    height="25"
                    viewBox="0 0 24 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.40381 14.7886C7.94221 17.327 12.0578 17.327 14.5962 14.7886C17.1346 12.2502 17.1346 8.1346 14.5962 5.59619C12.0578 3.05779 7.94221 3.05779 5.40381 5.59619C2.8654 8.1346 2.8654 12.2502 5.40381 14.7886Z"
                      stroke="currentColor"
                    />
                    <path
                      d="M19.1924 18.7922L14.9497 14.5496C14.7545 14.3543 14.4379 14.3543 14.2426 14.5496C14.0474 14.7449 14.0474 15.0614 14.2426 15.2567L18.4853 19.4993C18.6805 19.6946 18.9971 19.6946 19.1924 19.4993C19.3876 19.3041 19.3876 18.9875 19.1924 18.7922Z"
                      fill="currentColor"
                    />
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
                <Question clickable key={q.id} {...q} />
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
