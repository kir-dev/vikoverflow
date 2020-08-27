import { useSWRInfinite } from "swr";
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
  const { data, size, setSize } = useSWRInfinite((index, prevData) => {
    if (prevData && !prevData.nextCursor) return null;

    if (index === 0) return `/api/questions?topic=${topic}`;

    return `/api/questions?topic=${topic}&cursor=${prevData.nextCursor}&cursorCreatedAt=${prevData.nextCursorCreatedAt}`;
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
    if (!data || router.isFallback) return;

    if (!questions) {
      router.push("/404");
    }
  }, [data, topic, router.isFallback]);

  return (
    <Layout footer={false}>
      <div className={styles.root}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1>{topic}</h1>
            <p>{description}</p>
          </div>
          <div className={styles.headerActions}>
            {user && (
              <>
                <Link href={`/uj?tema=${topic}`} passHref>
                  <Button Component="a" small>
                    Új kérdés ehhez a témához
                  </Button>
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
  );
}

export async function getStaticPaths() {
  return {
    paths: [],
    // TODO change to stable blocking once released
    fallback: "unstable_blocking",
  };
}

export async function getStaticProps({ params }) {
  const getParams = {
    TableName: "Questions",
    Key: {
      PK: `TOPIC#${params.id}`,
      SK: `TOPIC#${params.id}`,
    },
  };

  const { Item } = await db.get(getParams).promise();

  return {
    props: {
      topic: Item ? Item.PK.split("#")[1] : null,
      description: Item ? Item.description : null,
    },
    revalidate: 1,
  };
}
