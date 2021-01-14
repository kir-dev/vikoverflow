import Layout from "components/layout";
import styles from "styles/pages/tema.module.css";
import useSWR from "swr";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import Button, { KIND } from "components/button";
import { Plus } from "components/icons";
import { useRouter } from "next/router";
import { useUser } from "lib/authenticate";
import Question from "components/question-list-element";
import useTopicQuestions from "swr/use-topic-questions";
import { getTopicById } from "pages/api/topics/[id]";

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  try {
    const topicData = await getTopicById(params.id);
    return {
      props: {
        initialTopicData: topicData,
      },
      revalidate: 1,
    };
  } catch (e) {
    return {
      notFound: true,
    };
  }
}

export default function TopicPage({ initialTopicData }) {
  const { user } = useUser();
  const router = useRouter();
  const topicId = router.query.id;
  const { data: topicData } = useSWR(
    topicId ? `/api/topics/${topicId}` : null,
    { initialData: initialTopicData, revalidateOnMount: true }
  );
  const {
    questions,
    initialDataLoaded,
    isEmpty,
    isReachingEnd,
    loadMore,
  } = useTopicQuestions();

  const [loaderRef, inView] = useInView({ rootMargin: "400px 0px" });

  useEffect(() => {
    if (topicData && !topicData.topic) {
      router.push("/404");
    }
  }, [topicData]);

  useEffect(() => {
    if (inView && !isReachingEnd) {
      loadMore();
    }
  }, [inView, isReachingEnd]);

  return (
    <Layout footerDark>
      <div className={styles.root}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1>{topicData?.topic?.id}</h1>
            <h2>
              {topicData?.topic &&
                `Eddig ${topicData.topic.numberOfQuestions} kérdés érkezett a témában`}
            </h2>
          </div>
          <div className={styles.headerActions}>
            {user && (
              <Button
                kind={KIND.icon}
                onClick={() => router.push(`/uj?temak=${topicData?.topic?.id}`)}
                tooltip="Új kérdés hozzáadása a témához"
              >
                <Plus />
              </Button>
            )}
          </div>
        </header>
        <main className={styles.main}>
          {topicData?.topic && initialDataLoaded ? (
            isEmpty ? (
              <h1 className={styles.empty}>
                Még nem érkeztek kérdések, tedd fel te az elsőt.
              </h1>
            ) : (
              <>
                {questions.map((q) => (
                  <Question key={q?.id} {...q} />
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
