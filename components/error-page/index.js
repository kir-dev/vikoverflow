import styles from "./error-page.module.css";
import Layout from "components/layout";
import Link from "next/link";

export default function ErrorPage({ statusCode, text }) {
  return (
    <Layout title={`${statusCode} - vikoverflow`}>
      <div className={styles.page}>
        <div className={styles.inner}>
          <h1>{statusCode}</h1>
          <h2>{text}</h2>
          <div className={styles.links}>
            <Link href="/">
              <a>Főoldal</a>
            </Link>
            <Link href="/uj">
              <a>Új kérdés</a>
            </Link>
            <Link href="/profil">
              <a>Profil</a>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
