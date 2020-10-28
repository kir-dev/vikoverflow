import Layout from "components/layout";
import styles from "styles/pages/index.module.css";
import useSWR, { useSWRInfinite } from "swr";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import Question from "components/__question-list-element";

export default function HomePage() {
  const { data, size, setSize } = useSWRInfinite((index, prevData) => {
    if (prevData && !prevData.nextCursor) return null;

    if (index === 0) return `/api/questions`;

    return `/api/questions?cursor=${prevData.nextCursor}&cursor2=${prevData.nextCursor2}`;
  });
  const { data: topicsData } = useSWR("/api/topics");

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
    <Layout>
      <div className={styles.root}>
        <aside className={styles.aside}>
          <div className={styles.topicStats}>
            <h1>Népszerű témák</h1>
            <ul>
              {topicsData ? (
                topicsData.topics.map((t) => (
                  <li key={t.id}>
                    <Link href={`/tema/${t.id}`}>
                      <a></a>
                    </Link>
                    <span>#{t.id}</span>
                    <span>{t.numberOfQuestions}</span>
                  </li>
                ))
              ) : (
                <>
                  <li></li>
                  <li></li>
                  <li></li>
                  <li></li>
                </>
              )}
            </ul>
          </div>
        </aside>
        <main className={styles.main}>
          {questions ? (
            <>
              {questions.map((q) => (
                <Question key={q.id} {...q} />
              ))}
              {!isReachingEnd && <Question skeleton ref={loaderRef} />}
            </>
          ) : (
            <>
              <Question skeleton />
              <Question skeleton />
              <Question skeleton />
              <Question skeleton />
              <Question skeleton />
              <Question skeleton />
            </>
          )}
        </main>
      </div>
    </Layout>
  );
}
