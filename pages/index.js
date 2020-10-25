import Layout from "components/layout";
import styles from "styles/pages/index.module.css";
import useSWR, { useSWRInfinite } from "swr";
import Avatar from "components/avatar";
import dayjs from "lib/dayjs";
import tempQuestionStyles from "styles/pages/newindexquestion.module.css";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { Comment, Hearth } from "components/icons";

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

  if (!questions || !topicsData) {
    return <Layout />;
  }

  return (
    <Layout>
      <div className={styles.root}>
        <aside className={styles.aside}>
          <div className={styles.topicStats}>
            <h1>Népszerű témák</h1>
            <ul>
              {topicsData.topics.map((t) => (
                <li key={t.id}>
                  <Link href={"/tema/[id]"} as={`/tema/${t.id}`}>
                    <a></a>
                  </Link>
                  <span>#{t.id}</span>
                  <span>{t.numberOfQuestions}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <main className={styles.main}>
          {questions.map((q) => (
            <Question {...q} />
          ))}
          {!isReachingEnd && <div ref={loaderRef}>loader div</div>}
        </main>
      </div>
    </Layout>
  );
}

function Question({
  id,
  title,
  body,
  upvotes,
  answers,
  topic,
  createdAt,
  creator,
}) {
  const { data: creatorData } = useSWR(creator ? `/api/user/${creator}` : null);

  return (
    <div className={tempQuestionStyles.container}>
      <Link href="/kerdes/[id]" as={`/kerdes/${id}`}>
        <a className={tempQuestionStyles.overlay}></a>
      </Link>
      <div className={tempQuestionStyles.header}>
        <div className={tempQuestionStyles.creator}>
          <Avatar
            loading={!creatorData?.user}
            id={creatorData?.user?.avatar}
            size={32}
            onClick={() => router.push("/profil/[id]", `/profil/${creator}`)}
          />
          <div className={tempQuestionStyles.creatorInfo}>
            <p>{creatorData?.user?.name}</p>
            <p>{dayjs(new Date(createdAt)).fromNow()}</p>
          </div>
        </div>
      </div>

      <div className={tempQuestionStyles.body}>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>

      <div className={tempQuestionStyles.footer}>
        <div className={tempQuestionStyles.actions}>
          <div className={tempQuestionStyles.action}>
            <Hearth fill={upvotes.currentUserUpvoted} />
            <span>{upvotes.count}</span>
          </div>
          <div className={tempQuestionStyles.action}>
            <Comment />

            <span>{answers.count}</span>
          </div>
        </div>
        <p className={tempQuestionStyles.topic}>#{topic}</p>
      </div>
    </div>
  );
}
