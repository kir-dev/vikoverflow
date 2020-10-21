import Layout from "components/layout";
import styles from "styles/pages/index.module.css";
import useSWR, { useSWRInfinite } from "swr";
import Avatar from "components/avatar";
import dayjs from "lib/dayjs";
import tempQuestionStyles from "styles/pages/newindexquestion.module.css";
import Link from "next/link";

export default function HomePage() {
  const { data, size, setSize } = useSWRInfinite((index, prevData) => {
    if (prevData && !prevData.nextCursor) return null;

    if (index === 0) return `/api/questions`;

    return `/api/questions?cursor=${prevData.nextCursor}&cursor2=${prevData.nextCursor2}`;
  });
  const { data: topicsData } = useSWR("/api/topics");

  const isErrored = data?.some((p) => !!p.error);
  const isReachingEnd = data && !data[data.length - 1]?.nextCursor;
  const questions =
    data && !isErrored
      ? [].concat(...data.map((page) => page.questions))
      : null;

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
            <HearthIcon fill={upvotes.currentUserUpvoted} />
            <span>{upvotes.count}</span>
          </div>
          <div className={tempQuestionStyles.action}>
            <CommentIcon />

            <span>{answers.count}</span>
          </div>
        </div>
        <p className={tempQuestionStyles.topic}>#{topic}</p>
      </div>
    </div>
  );
}

function HearthIcon({ fill }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill={fill ? "currentColor" : "none"}
    >
      <path
        d="M19.2584 5.74144L19.2586 5.7416C19.6521 6.13499 19.9643 6.60207 20.1774 7.11615C20.3904 7.63023 20.5 8.18124 20.5 8.73771C20.5 9.29417 20.3904 9.84518 20.1774 10.3593C19.9643 10.8733 19.6521 11.3404 19.2586 11.7338L19.2585 11.7339L18.3457 12.6467L11.9998 18.9926L5.65384 12.6467L4.74106 11.7339C3.94642 10.9393 3.5 9.8615 3.5 8.73771C3.5 7.61392 3.94642 6.53616 4.74106 5.74152C5.5357 4.94688 6.61346 4.50046 7.73725 4.50046C8.86104 4.50046 9.9388 4.94688 10.7334 5.74152L11.6462 6.6543C11.8415 6.84957 12.1581 6.84957 12.3533 6.6543L13.2661 5.74152L13.2662 5.74144C13.6596 5.34787 14.1267 5.03566 14.6407 4.82265C15.1548 4.60964 15.7058 4.5 16.2623 4.5C16.8188 4.5 17.3698 4.60964 17.8839 4.82265C18.3979 5.03566 18.865 5.34787 19.2584 5.74144Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.707 20.793C11.5671 20.9328 11.389 21.028 11.195 21.0666C11.0011 21.1052 10.8 21.0853 10.6173 21.0097C10.4346 20.934 10.2785 20.8059 10.1686 20.6415C10.0587 20.477 10 20.2838 10 20.086V18H5C4.46957 18 3.96086 17.7893 3.58579 17.4142C3.21071 17.0391 3 16.5304 3 16V6C3 5.46957 3.21071 4.96086 3.58579 4.58579C3.96086 4.21071 4.46957 4 5 4H19C19.5304 4 20.0391 4.21071 20.4142 4.58579C20.7893 4.96086 21 5.46957 21 6V16C21 16.5304 20.7893 17.0391 20.4142 17.4142C20.0391 17.7893 19.5304 18 19 18H14.5L11.707 20.793ZM11 20.086L14.086 17H19C19.2652 17 19.5196 16.8946 19.7071 16.7071C19.8946 16.5196 20 16.2652 20 16V6C20 5.73478 19.8946 5.48043 19.7071 5.29289C19.5196 5.10536 19.2652 5 19 5H5C4.73478 5 4.48043 5.10536 4.29289 5.29289C4.10536 5.48043 4 5.73478 4 6V16C4 16.2652 4.10536 16.5196 4.29289 16.7071C4.48043 16.8946 4.73478 17 5 17H11V20.086Z"
        fill="currentColor"
      />
    </svg>
  );
}
