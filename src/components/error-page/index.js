import styles from "./error-page.module.css";
import Layout from "components/layout";
import Link from "next/link";
import { useMemo } from "react";

function getErrorMessage(statusCode) {
  switch (statusCode) {
    case 404:
      return "A kért oldal nem található";

    default:
      return "Sajnálatos hiba lépett fel";
  }
}

export default function ErrorPage({ statusCode, showGithub }) {
  const text = useMemo(() => getErrorMessage(statusCode), [statusCode]);

  return (
    <Layout footerDark>
      <div className={styles.page}>
        <div className={styles.inner}>
          <h1>{statusCode}</h1>
          <h2>{text}</h2>

          <div className={styles.links}>
            {statusCode !== 404 ? (
              <a
                href="https://github.com/kir-dev/vikoverflow/issues/new"
                target="_blank"
                rel="noopener"
              >
                Küldj be egy issuet!
              </a>
            ) : (
              <>
                <Link href="/">
                  <a>Főoldal</a>
                </Link>
                <Link href="/uj">
                  <a>Új kérdés</a>
                </Link>
                <Link href="/profil">
                  <a>Profil</a>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
