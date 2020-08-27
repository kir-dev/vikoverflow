import useSWR from "swr";
import Skeleton from "components/skeleton";
import Link from "next/link";
import styles from "./topics.module.css";

export default function Topics({ search }) {
  const { data } = useSWR(
    `/api/topics${search ? `?search=${search}` : ""}`
  );

  return (
    <div className={styles.topicsWrapper}>
      <h2>{search ? "Keresett témák" : "Népszerű témák"}</h2>
      <ul className={styles.topicsList}>
        {data?.topics ? (
          data.topics.length ? (
            data.topics.map((topic) => (
              <li className={styles.topic} key={topic.id}>
                <Link href={"/tema/[id]"} as={`/tema/${topic.id}`}>
                  <a></a>
                </Link>
                <span>{topic.id}</span>
                <span className={styles.topicNumber}>
                  {topic.numberOfQuestions}
                </span>
              </li>
            ))
          ) : (
            <li className={`${styles.topic} ${styles.empty}`}>
              Nem találtunk témákat
            </li>
          )
        ) : (
          <>
            <li className={styles.topic}>
              <Skeleton
                style={{ width: "71%", height: 20, margin: "10px 0" }}
              />
            </li>
            <li className={styles.topic}>
              <Skeleton
                style={{ width: "67%", height: 20, margin: "10px 0" }}
              />
            </li>
            <li className={styles.topic}>
              <Skeleton
                style={{ width: "80%", height: 20, margin: "10px 0" }}
              />
            </li>
            <li className={styles.topic}>
              <Skeleton
                style={{ width: "60%", height: 20, margin: "10px 0" }}
              />
            </li>
            <li className={styles.topic}>
              <Skeleton
                style={{ width: "68%", height: 20, margin: "10px 0" }}
              />
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
