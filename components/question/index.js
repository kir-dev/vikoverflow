import styles from "./question.module.css";
import Skeleton from "components/skeleton";
import { ThumbsUp, MessageCircle, File } from "react-feather";
import Link from "next/link";
import cn from "clsx";
import { forwardRef, memo } from "react";
import Avatar from "components/avatar";
import useSWR from "swr";
import { useRouter } from "next/router";
import Linkify from "components/linkify";
import dayjs from "lib/dayjs";

function Question(
  {
    id,
    skeleton,
    title,
    body,
    upvotes,
    topic,
    answers,
    clickable,
    innerRef,
    onUpvoteClick,
    allowActions,
    createdAt,
    creator,
    attachment,
  },
  ref
) {
  const { data } = useSWR(creator ? `/api/user/${creator}` : null);
  const router = useRouter();

  if (skeleton) {
    return (
      <div ref={ref} className={styles.root}>
        <div className={styles.content}>
          <div className={styles.titleRow}>
            <Skeleton style={{ height: 24, width: 250 }} />
            <Avatar loading className={styles.avatar} size={28} />
            <span className={styles.date}>
              <Skeleton style={{ marginLeft: 8, height: 16, width: 80 }} />
            </span>
          </div>

          <Skeleton
            style={{ height: 82, width: "100%", margin: "0.75rem 0" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Skeleton style={{ display: "flex", height: 20, width: 200 }} />
            <Skeleton
              style={{
                display: "flex",
                height: 20,
                width: 64,
                marginBottom: "1rem",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={innerRef}
      className={cn(styles.root, {
        [styles.clickable]: clickable,
        [styles.allowActions]: allowActions,
      })}
    >
      {clickable && (
        <Link href={`/kerdes/${id}`}>
          <a className={styles.overlay}></a>
        </Link>
      )}
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h1>{title}</h1>
          <Avatar
            loading={!data?.user}
            id={data?.user?.avatar}
            className={styles.avatar}
            size={28}
            onClick={() => router.push("/profil/[id]", `/profil/${creator}`)}
          />
          {createdAt && (
            <span className={styles.date}>
              {dayjs(new Date(createdAt)).fromNow()}
            </span>
          )}
        </div>
        <p>
          <Linkify>{body}</Linkify>
        </p>
        {attachment && (
          <div className={styles.attachments}>
            <a
              href={`${process.env.NEXT_PUBLIC_S3_URL}/${attachment.s3Key}`}
              target="_blank"
              rel="noopener"
              className={styles.attachment}
            >
              <File size={20} />
              <span className={styles.attachmentName}>
                {attachment.originalName}
              </span>
            </a>
          </div>
        )}
        <div className={styles.stats}>
          <span className={styles.stat}>
            <span
              onClick={allowActions && onUpvoteClick}
              className={cn(styles.statIcon, styles.action, {
                [styles.fill]: upvotes?.currentUserUpvoted,
              })}
            >
              <ThumbsUp size={18} />
            </span>
            <span className={styles.statCount}>{upvotes?.count}</span>
          </span>
          <span className={styles.stat}>
            <span className={styles.statIcon}>
              <MessageCircle size={18} />
            </span>
            <span className={styles.statCount}>{answers?.count}</span>
          </span>
          <span className={styles.topic}>#{topic}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(forwardRef(Question));
