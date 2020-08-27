import Head from "next/head";
import Layout from "components/layout";
import { useUser } from "lib/authenticate";
import { UploadAvatar } from "components/avatar";
import styles from "styles/pages/profil.module.css";
import { useSWRInfinite } from "swr";
import Input from "components/input";
import Textarea from "components/textarea";
import Button from "components/button";
import Skeleton from "components/skeleton";
import Link from "next/link";
import { ACTIVITY } from "lib/constants";

function stringifyActivity(a) {
  switch (a.type) {
    case ACTIVITY.QUESTION:
      return (
        <>
          Létrehoztad a(z){" "}
          <Link href="/kerdes/[id]" as={`/kerdes/${a.id}`}>
            <a>{a.title}</a>
          </Link>{" "}
          című kérdést
        </>
      );

    case ACTIVITY.TOPIC:
      return (
        <>
          Új témát hoztál létre{" "}
          <Link href="/tema/[id]" as={`/tema/${a.name}`}>
            <a>{a.name}</a>
          </Link>{" "}
          néven
        </>
      );

    case ACTIVITY.QUESTION_UPVOTE:
      return (
        <>
          Tetszett a{" "}
          <Link href="/kerdes/[id]" as={`/kerdes/${a.id}`}>
            <a>{a.title}</a>
          </Link>{" "}
          című kérdés
        </>
      );

    case ACTIVITY.ANSWER:
      return (
        <>
          Válaszoltál a{" "}
          <Link href="/kerdes/[id]" as={`/kerdes/${a.id}`}>
            <a>{a.title}</a>
          </Link>{" "}
          című kérdésre
        </>
      );

    case ACTIVITY.ANSWER_UPVOTE:
      return (
        <>
          Tetszett egy válasz a{" "}
          <Link href="/kerdes/[id]" as={`/kerdes/${a.id}`}>
            <a>{a.title}</a>
          </Link>{" "}
          című kérdésre
        </>
      );

    default:
      throw new Error("unknown activity type");
  }
}

export default function ProfilePage() {
  const { user } = useUser("/belepes");
  const { data, size, setSize } = useSWRInfinite((index, prevData) => {
    if (!user.id || (prevData && !prevData.nextCursor)) return null;

    if (index === 0) return `/api/user/profile/${user.id}`;

    return `/api/user/profile/${user.id}?cursorPK=${encodeURIComponent(
      prevData.nextCursor.PK
    )}&cursorSK=${encodeURIComponent(prevData.nextCursor.SK)}&cursorCreatedAt=${
      prevData.nextCursor.createdAt
    }`;
  });

  const isErrored = data?.some((p) => !!p.error);
  const isReachingEnd = data && !data[data.length - 1]?.nextCursor;
  const activities =
    data && !isErrored
      ? [].concat(...data.map((page) => page.activities))
      : null;

  return (
    <>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            if (document.cookie.indexOf("logged-in=") === -1) {
              window.location.replace('/belepes')
            }
          `,
          }}
        />
      </Head>

      {user && <span style={{ display: "none" }} data-test="userIsLoggedIn" />}

      <Layout>
        <div className={styles.root}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <UploadAvatar size={102} />
              <div className={styles.info}>
                {user ? (
                  <>
                    <h1>{user?.name}</h1>
                    <h2>Halika, ez a biom 👋</h2>
                  </>
                ) : (
                  <>
                    <Skeleton style={{ height: 36, width: 195 }} />
                    <Skeleton
                      style={{ height: 19, width: 180, marginTop: "0.75rem" }}
                    />
                  </>
                )}
              </div>
            </div>
          </header>
          <div className={styles.main}>
            <div className={styles.mainContent}>
              <div className={styles.left}>
                <div className={styles.settingsContainer}>
                  <div className={styles.settings}>
                    <label>
                      <span>név</span>
                      <Input
                        disabled
                        value={user?.name}
                        placeholder="Neved..."
                      />
                    </label>
                    <label>
                      <span>e-mail</span>
                      <Input
                        disabled
                        value={user?.email}
                        placeholder="E-mail címed..."
                      />
                    </label>
                    <label>
                      <span>bemutatkozás</span>
                      <Textarea
                        minRows={4}
                        disabled={!user}
                        value={user?.bio}
                        placeholder="Rövid bemutatkozás, mely a profilodon fog megjelenni..."
                      />
                    </label>
                  </div>
                  <div className={styles.footer}>
                    <p>Néhány mezőt csak az AuthSCH-ban módosíthatsz.</p>
                    <Button disabled>Mentés</Button>
                  </div>
                </div>
              </div>
              <div className={styles.right}>
                <h2>Legutóbbi tevékenységeid</h2>
                <ul className={styles.activities}>
                  {activities?.map((a) => (
                    <li>{stringifyActivity(a)}</li>
                  ))}
                </ul>

                {!isReachingEnd && activities?.length && (
                  <span
                    onClick={() => setSize(size + 1)}
                    className={styles.loadMore}
                  >
                    Továbbiak betöltése...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
