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

const Header = () => {
  const router = useRouter();

  const { isLoading, user } = useUser();
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
                <Menu>
                  <>
                    <Menu.Button className={styles.menuButton}>
                      <Avatar size={28} />
                    </Menu.Button>

                    <Menu.Items className={styles.menuItems}>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => router.push("/profil")}
                            className={cn(styles.menuItem, {
                              [styles.active]: active,
                            })}
                          >
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M12 5.5C11.606 5.5 11.2159 5.5776 10.8519 5.72836C10.488 5.87913 10.1573 6.1001 9.87868 6.37868C9.6001 6.65726 9.37913 6.98797 9.22836 7.35195C9.0776 7.71593 9 8.10603 9 8.5C9 8.89397 9.0776 9.28407 9.22836 9.64805C9.37913 10.012 9.6001 10.3427 9.87868 10.6213C10.1573 10.8999 10.488 11.1209 10.8519 11.2716C11.2159 11.4224 11.606 11.5 12 11.5C12.7956 11.5 13.5587 11.1839 14.1213 10.6213C14.6839 10.0587 15 9.29565 15 8.5C15 7.70435 14.6839 6.94129 14.1213 6.37868C13.5587 5.81607 12.7956 5.5 12 5.5ZM5.5 17.5V17.667C5.5 18.074 6.139 18.5 7 18.5H17C17.861 18.5 18.5 18.074 18.5 17.667V17.5C18.5 15.35 15.624 13.5 12 13.5C8.376 13.5 5.5 15.35 5.5 17.5Z"
                                stroke="#202020"
                              />
                            </svg>
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
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6.5 8.3V5.63C6.5 4.46 7.4 3.5 8.5 3.5H15.5C16.6 3.5 17.5 4.45 17.5 5.63V17.37C17.5 18.54 16.6 19.5 15.5 19.5H8.5C7.4 19.5 6.5 18.55 6.5 17.37V14.7"
                                stroke="#202020"
                              />
                              <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M12.8 11L10.65 8.85001C10.5927 8.80703 10.5453 8.75224 10.511 8.68934C10.4767 8.62644 10.4563 8.55691 10.4513 8.48546C10.4462 8.414 10.4565 8.34229 10.4816 8.27517C10.5066 8.20806 10.5458 8.14711 10.5964 8.09646C10.6471 8.04581 10.708 8.00663 10.7752 7.98158C10.8423 7.95653 10.914 7.94619 10.9854 7.95127C11.0569 7.95635 11.1264 7.97672 11.1893 8.01101C11.2522 8.0453 11.307 8.0927 11.35 8.15001L14 10.79C14.0937 10.883 14.1681 10.9936 14.2189 11.1154C14.2697 11.2373 14.2958 11.368 14.2958 11.5C14.2958 11.632 14.2697 11.7627 14.2189 11.8846C14.1681 12.0064 14.0937 12.117 14 12.21L11.35 14.85C11.2537 14.9222 11.1346 14.9573 11.0146 14.9488C10.8945 14.9402 10.7816 14.8887 10.6964 14.8036C10.6113 14.7185 10.5598 14.6055 10.5513 14.4855C10.5427 14.3654 10.5778 14.2463 10.65 14.15L12.79 12H4.5C4.36739 12 4.24021 11.9473 4.14645 11.8536C4.05268 11.7598 4 11.6326 4 11.5C4 11.3674 4.05268 11.2402 4.14645 11.1465C4.24021 11.0527 4.36739 11 4.5 11H12.8Z"
                                fill="#202020"
                              />
                            </svg>
                            Kilépés
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </>
                </Menu>
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
