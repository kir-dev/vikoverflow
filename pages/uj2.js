import Layout from "components/layout";
import styles from "styles/pages/uj.module.css";
import Avatar from "components/avatar";
import useSWR from "swr";
import { useUser } from "lib/authenticate";
import Button from "components/button";

export default function NewQuestionPage() {
  const { user } = useUser("/belepes");
  const { data: userData } = useSWR(user?.id ? `/api/user/${user.id}` : "");

  return (
    <Layout>
      <div className={styles.root}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.creator}>
              <Avatar
                loading={!userData?.user}
                id={userData?.user?.avatar}
                size={32}
              />
              <div className={styles.creatorInfo}>
                <p>{userData?.user?.name}</p>
                <p>most</p>
              </div>
            </div>
          </div>

          <div
            contentEditable
            placeholder="A kérdésed címe..."
            className={styles.title}
          />
          <div
            contentEditable
            placeholder="A kérdésed törzse..."
            className={styles.body}
          />
        </div>
        <div className={styles.actions}>
          <Button disabled>Küldés</Button>
        </div>
      </div>
    </Layout>
  );
}
