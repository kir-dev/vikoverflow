import styles from "./header.module.css";
import cn from "classnames";
import Link from "next/link";
import { logout, useUser } from "lib/authenticate";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Toggle from "./toggle";
import Button from "components/button";
import Head from "next/head";

const ActiveLink = ({ href, children, className }) => {
  const router = useRouter();

  return (
    <Link href={href}>
      <a
        className={cn(className, { [styles.active]: router.pathname === href })}
      >
        {children}
      </a>
    </Link>
  );
};

const Header = () => {
  const { isLoading, user } = useUser();
  const [active, setActive] = useState(false);

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "auto";
  }, [active]);

  return (
    <>
      <Head>
        <link
          rel="preload"
          href="/api/user"
          as="fetch"
          crossOrigin="anonymous"
        />
      </Head>
      <header className={cn(styles.root, { [styles.active]: active })}>
        <div className={styles.content}>
          <Link href="/">
            <a className={styles.logo}>vikoverflow</a>
          </Link>

          <div
            onClick={() => setActive(!active)}
            className={cn(styles.toggle, { [styles.visible]: !isLoading })}
          >
            <Toggle active={active} />
          </div>

          <nav className={styles.leftNav}>
            <ActiveLink
              href="/uj"
              className={cn(styles.ask, {
                [styles.visible]: !isLoading && user,
              })}
            >
              Új kérdés
            </ActiveLink>
          </nav>
          <nav
            className={cn(styles.rightNav, { [styles.visible]: !isLoading })}
          >
            {user ? (
              <>
                <ActiveLink href="/profil">Profil</ActiveLink>
                <a onClick={logout}>Kilépés</a>
              </>
            ) : (
              <>
                <ActiveLink href="/belepes">Belépés</ActiveLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className={cn(styles.mobileNav, { [styles.active]: active })}>
        {user ? (
          <>
            <Link href="/uj" passHref>
              <Button>Új kérdés</Button>
            </Link>
            <Link href="/profil">
              <a>Profil</a>
            </Link>
            <a onClick={logout}>Kilépés</a>
          </>
        ) : (
          <Link href="/belepes">
            <a>Belépés</a>
          </Link>
        )}
      </div>
    </>
  );
};

export default Header;
