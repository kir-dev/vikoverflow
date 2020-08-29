import styles from "styles/pages/profil.module.css";
import Avatar from "components/avatar";
import useSWR from "swr";
import { useRouter } from "next/router";
import Layout from "components/layout";
import { useEffect } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const { data } = useSWR(
    router.query.id ? `/api/user/${router.query.id}` : null
  );

  useEffect(() => {
    if (!data) return;

    if (!data.user) {
      router.push("/404");
    }
  }, [data]);

  return (
    <Layout>
      <div className={styles.root}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Avatar loading={!data?.user} id={data?.user?.avatar} size={102} />
            <div className={styles.info}>
              {data?.user?.name && <h1>{data?.user?.name}</h1>}
              {data?.user?.bio && <h2>{data.user.bio}</h2>}
            </div>
          </div>
        </header>
        <div className={styles.main}>
          <div className={styles.mainContent}></div>
        </div>
      </div>
    </Layout>
  );
}
