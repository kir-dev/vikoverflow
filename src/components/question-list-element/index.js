import Avatar from "components/avatar";
import { useRouter } from "next/router";
import dayjs from "lib/dayjs";
import { Comment, Hearth } from "components/icons";
import styles from "./question-list-element.module.css";
import useSWR from "swr";
import cn from "clsx";
import { forwardRef } from "react";

export default forwardRef(function QuestionListElement(
  { id, title, body, upvotes, answers, topics, createdAt, creator, skeleton },
  ref
) {
  const router = useRouter();
  const { data: creatorData } = useSWR(creator ? `/api/user/${creator}` : null);

  if (skeleton) {
    return (
      <div ref={ref} className={styles.container}>
        <div className={styles.header}>
          <div className={styles.creator}>
            <Avatar skeleton size={32} />
          </div>
        </div>

        <div className={cn(styles.body, styles.skeleton)} />

        <div className={styles.footer}>
          <div className={styles.actions}>
            <div className={styles.action}>
              <Hearth />
              <span className={styles.hidden}>0</span>
            </div>
            <div className={styles.action}>
              <Comment />
              <span className={styles.hidden}>0</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      onClick={() => router.push(`/kerdes/${id}`)}
    >
      <div className={styles.header}>
        <div className={styles.creator}>
          <Avatar
            loading={!creatorData?.user}
            id={creatorData?.user?.avatar}
            size={32}
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
        <div className={styles.topics}>
          {topics.slice(0, 3).map((topic, i) => (
            <p className={styles.topic}>
              #{topic}
              {topics.length > 3 && i === 2 ? ", …" : null}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
});
