import useSWR, { useSWRInfinite } from "swr";
import { useRouter } from "next/router";
import Layout from "components/layout";
import { useEffect } from "react";
import styles from "styles/pages/tema.module.css";
import Question from "components/question";
import db from "lib/api/db";
import Button from "components/button";
import Link from "next/link";
import { useUser } from "lib/authenticate";
import { useInView } from "react-intersection-observer";

// TODO rendes skeletont a listanak itt is meg a gomboknak, gombok apperaeljenek mint a headerbe a cuccok ha be van lepve
// es ha creator (ez csak a modosito gombhoz)
// TODO kerdes gomb csak prefilleli a temat
// TODO tema leiras modositasa pedig egy modal amibe a tema creatora valtoztathat
// TODO az empty text containerje rossz szelessegu es mobilon is van borderje

export default function TopicPage({ topic, description }) {
  const { user } = useUser();
  const router = useRouter();
  const topicId = router.query.id;
  const { data: topicData } = useSWR(topicId ? `/api/topic/${topicId}` : null);
  const { data, size, setSize } = useSWRInfinite((index, prevData) => {
    if ((prevData && !prevData.nextCursor) || !topicData?.topic?.id)
      return null;

    if (index === 0) return `/api/questions?topic=${topicData.topic.id}`;

    return `/api/questions?topic=${topicData.topic.id}&cursor=${prevData.nextCursor}&cursorCreatedAt=${prevData.nextCursorCreatedAt}`;
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

  useEffect(() => {
    if (!topicData) return;

    if (!topicData.topic) {
      router.push("/404");
    }
  }, [topicData]);

  return (
    <Layout footer={false}>
      <div className={styles.root}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1>{topicData?.topic?.id}</h1>
            <p>{topicData?.topic?.description}</p>
          </div>
          <div className={styles.headerActions}>
            {user && topicData?.topic?.id && (
              <>
                <Link href={`/uj?tema=${topicData?.topic?.id}`}>
                  <Button small>Új kérdés ehhez a témához</Button>
                </Link>

                <Button small>Téma leírásának módosítása</Button>
              </>
            )}
          </div>
        </header>

        {isErrored ? (
          <div className={styles.empty}>
            <h1>Hiba lépett fel</h1>
          </div>
        ) : !questions ? (
          <div className={styles.questions}>
            <Question skeleton />
            <Question skeleton />
            <Question skeleton />
            <Question skeleton />
            <Question skeleton />
          </div>
        ) : questions.length > 0 ? (
          <div className={styles.questions}>
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
  );
}
