import Layout from "components/layout";
import styles from "styles/pages/index.module.css";
import useSWR from "swr";
import { useRouter } from "next/router";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import Question from "components/question-list-element";
import useQuestions from "swr/use-questions";
import { getQuestions } from "pages/api/questions";
import { getTopics } from "pages/api/topics";

export async function getStaticProps() {
  const initialQuestionsData = [await getQuestions()];
  const initialTopicsData = await getTopics();
  return {
    props: { initialQuestionsData, initialTopicsData },
    revalidate: 1,
  };
}

export default function HomePage({ initialQuestionsData, initialTopicsData }) {
  const router = useRouter();
  const {
    questions,
    initialDataLoaded,
    isEmpty,
    isReachingEnd,
    loadMore,
    hasNewQuestions,
    addNewQuestions,
  } = useQuestions({ initialData: initialQuestionsData });
  const { data: topicsData } = useSWR("/api/topics", {
    initialData: initialTopicsData,
  });
  const [loaderRef, inView] = useInView({ rootMargin: "400px 0px" });

  useEffect(() => {
    if (inView && !isReachingEnd) {
      loadMore();
    }
  }, [inView, isReachingEnd]);

  return (
    <Layout>
      <div className={styles.root}>
        <aside className={styles.aside}>
          <div className={styles.topicStats}>
            <h1>Népszerű témák</h1>
            <ul>
              {topicsData?.topics ? (
                topicsData.topics.map((t) => (
                  <li key={t.id} onClick={() => router.push(`/tema/${t.id}`)}>
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
          {initialDataLoaded ? (
            isEmpty ? (
              <h1 className={styles.empty}>
                Még nem érkeztek kérdések, tedd fel te az elsőt.
              </h1>
            ) : (
              <>
                {questions.map((q) => (
                  <Question key={q.id} {...q} />
                ))}
                {!isReachingEnd && <Question skeleton ref={loaderRef} />}
              </>
            )
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
