import Avatar from "components/avatar";
import Link from "next/link";
import dayjs from "lib/dayjs";
import { Comment, Hearth } from "components/icons";
import styles from "./question-list-element.module.css";
import useSWR from "swr";

export default function QuestionListElement({
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
    <div className={styles.container}>
      <Link href={`/kerdes/${id}`}>
        <a className={styles.overlay}></a>
      </Link>
      <div className={styles.header}>
        <div className={styles.creator}>
          <Avatar
            loading={!creatorData?.user}
            id={creatorData?.user?.avatar}
            size={32}
            onClick={() => router.push("/profil/[id]", `/profil/${creator}`)}
          />
          <div className={styles.creatorInfo}>
            <p>{creatorData?.user?.name}</p>
            <p>{dayjs(new Date(createdAt)).fromNow()}</p>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>

      <div className={styles.footer}>
        <div className={styles.actions}>
          <div className={styles.action}>
            <Hearth fill={upvotes.currentUserUpvoted} />
            <span>{upvotes.count}</span>
          </div>
          <div className={styles.action}>
            <Comment />

            <span>{answers.count}</span>
          </div>
        </div>
        <p className={styles.topic}>#{topic}</p>
      </div>
    </div>
  );
}