import styles from "./header.module.css";
import cn from "clsx";
import Link from "next/link";
import { logout, useUser } from "lib/authenticate";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Toggle from "./toggle";
import Button from "components/button";
import Avatar from "components/avatar";
import { Menu } from "@headlessui/react";
import SearchInput from "./search-input";
import Tooltip from "components/tooltip";
import useSWR from "swr";
import { Plus, User, Logout } from "components/icons";

const Header = () => {
  const router = useRouter();

  const { isLoading, user } = useUser();
  const { data: userData } = useSWR(user?.id ? `/api/user/${user.id}` : null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "auto";
  }, [active]);

  return (
    <>
      <header className={cn(styles.root, { [styles.active]: active })}>
        <div className={styles.content}>
          <Link href="/">
            <a className={styles.logo}>vikoverflow</a>
          </Link>

          <SearchInput />

          <div
            onClick={() => setActive(!active)}
            className={cn(styles.toggle, { [styles.visible]: !isLoading })}
          >
            <Toggle active={active} />
          </div>
          {isLoading}

          <nav
            className={cn(styles.rightNav, { [styles.visible]: !isLoading })}
          >
            {user ? (
              <div className={styles.menuWrapper}>
                <Tooltip label="Új kérdés hozzáadása">
                  <button
                    className={styles.plusButton}
                    onClick={() => router.push("/uj")}
                  >
                    <Plus />
                  </button>
                </Tooltip>
                <div>
                  <Menu>
                    <>
                      <Menu.Button className={styles.menuButton}>
                        <Avatar
                          onClick={() => {}}
                          size={28}
                          loading={!userData?.user}
                          id={userData?.user?.avatar}
                          label={false}
                        />
                      </Menu.Button>

                      <Menu.Items className={styles.menuItems}>
                        <div className={styles.user}>
                          <Avatar
                            size={42}
                            loading={!userData?.user}
                            id={userData?.user?.avatar}
                            label={false}
                          />
                          <div className={styles.userInfo}>
                            <p>{userData?.user?.name}</p>
                            <p>{userData?.user?.email}</p>
                          </div>
                        </div>
                        <div className={styles.separator} />
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => router.push("/profil")}
                              className={cn(styles.menuItem, {
                                [styles.active]: active,
                              })}
                            >
                              <User />
                              Profil
                            </button>
                          )}
                        </Menu.Item>
                        <div className={styles.separator} />
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={logout}
                              className={cn(styles.menuItem, {
                                [styles.active]: active,
                              })}
                            >
                              <Logout />
                              Kilépés
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </>
                  </Menu>
                </div>
              </div>
            ) : (
              <>
                <Link href="/belepes">Belépés</Link>
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
