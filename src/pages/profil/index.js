import Head from "next/head";
import Layout from "components/layout";
import { useUser } from "lib/authenticate";
import { UploadAvatar } from "components/avatar";
import styles from "styles/pages/profil.module.css";
import useSWR, { mutate } from "swr";
import Input from "components/input";
import Button from "components/button";
import Link from "next/link";
import { ACTIVITY } from "lib/constants";
import { useToasts } from "components/toasts";
import { UserProfileSchema } from "lib/schemas";
import cn from "clsx";
import { trimSpaces } from "lib/utils";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect } from "react";
import { Edit } from "components/icons";
import useActivities from "swr/use-activities";

export default function ProfilePage() {
  const { user } = useUser("/belepes");
  const { data: userData } = useSWR(user?.id ? `/api/user/${user.id}` : "");
  const {
    activities,
    initialDataLoaded,
    isLoadingMore,
    isEmpty,
    isReachingEnd,
    loadMore,
  } = useActivities();
  const { addToast } = useToasts();

  const { register, handleSubmit, reset, errors, formState } = useForm({
    resolver: yupResolver(UserProfileSchema),
    mode: "onChange",
  });

  const { isDirty, isValid, isSubmitting } = formState;

  useEffect(() => {
    if (userData?.user) {
      reset({ bio: userData.user.bio ?? "" });
    }
  }, [userData]);

  async function onSubmit(values) {
    const res = await fetch(`/api/user/${user.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bio: values.bio }),
    });

    if (res.ok) {
      mutate(
        `/api/user/${user.id}`,
        (oldData) => ({
          user: {
            ...oldData.user,
            bio: trimSpaces(values.bio),
          },
        }),
        false
      );
      addToast("Sikeresen szerkesztetted a profilod");
    } else {
      mutate(`/api/user/${user.id}`);
      addToast("Hiba lépett fel profilod szerkesztése közben", {
        errored: true,
      });
    }
  }

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

      <Layout>
        <div className={styles.root}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.avatar}>
                <UploadAvatar size={102} />
                <div className={styles.editOverlay}>
                  <Edit />
                </div>
              </div>
              <div className={styles.info}>
                {userData?.user?.name && <h1>{userData?.user?.name}</h1>}
                {userData?.user && <h2>{userData?.user?.bio}</h2>}
              </div>
            </div>
          </header>
          <div className={styles.main}>
            <div className={styles.mainContent}>
              <div className={styles.left}>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className={styles.settingsContainer}
                >
                  <div className={styles.settings}>
                    <Input
                      disabled
                      value={userData?.user?.name}
                      placeholder="Neved..."
                      label="Név"
                    />
                    <Input
                      disabled
                      value={userData?.user?.email}
                      placeholder="E-mail címed..."
                      label="Email"
                    />
                    <Input
                      name="bio"
                      ref={register}
                      disabled={!userData?.user || isSubmitting}
                      placeholder="Rövid bemutatkozás, mely a profilodon fog megjelenni..."
                      label="Bemutatkozás"
                      error={errors?.bio?.message}
                    />

                    <div className={styles.submitRow}>
                      <div className={styles.warning}>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5.9497 11C8.68334 11 10.8994 8.76142 10.8994 6C10.8994 3.23858 8.68334 1 5.9497 1C3.21606 1 1 3.23858 1 6C1 8.76142 3.21606 11 5.9497 11Z"
                            stroke="#7B7B7B"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M5.94971 8V6"
                            stroke="#7B7B7B"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M5.94971 4H5.95471"
                            stroke="#7B7B7B"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                        <p>
                          Néhány mezőt csak az{" "}
                          <a
                            href="https://auth.sch.bme.hu/"
                            target="_blank"
                            rel="noopener"
                          >
                            AuthSCH
                          </a>
                          -ban módosíthatsz.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting || !(isValid && isDirty)}
                      >
                        Mentés
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
              <div className={styles.right}>
                <h2>Legutóbbi tevékenységeid</h2>
                {initialDataLoaded && !isEmpty && (
                  <>
                    <ul className={styles.activities}>
                      {activities.map((a) => (
                        <li>{stringifyActivity(a)}</li>
                      ))}
                    </ul>

                    {!isReachingEnd && (
                      <span
                        onClick={() => !isLoadingMore && loadMore()}
                        className={cn(styles.loadMore, {
                          [styles.loading]: isLoadingMore,
                        })}
                      >
                        Továbbiak betöltése...
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

function stringifyActivity(a) {
  switch (a.type) {
    case ACTIVITY.QUESTION:
      return (
        <>
          Létrehoztad a(z){" "}
          <Link href={`/kerdes/${a.id}`}>
            <a>{a.title}</a>
          </Link>{" "}
          című kérdést
        </>
      );

    case ACTIVITY.TOPIC:
      return (
        <>
          Új témát hoztál létre{" "}
          <Link href={`/tema/${a.name}`}>
            <a>{a.name}</a>
          </Link>{" "}
          néven
        </>
      );

    case ACTIVITY.QUESTION_UPVOTE:
      return (
        <>
          Tetszett a{" "}
          <Link href={`/kerdes/${a.id}`}>
            <a>{a.title}</a>
          </Link>{" "}
          című kérdés
        </>
      );

    case ACTIVITY.ANSWER:
      return (
        <>
          Válaszoltál a{" "}
          <Link href={`/kerdes/${a.id}`}>
            <a>{a.title}</a>
          </Link>{" "}
          című kérdésre
        </>
      );

    case ACTIVITY.ANSWER_UPVOTE:
      return (
        <>
          Tetszett egy válasz a{" "}
          <Link href={`/kerdes/${a.id}`}>
            <a>{a.title}</a>
          </Link>{" "}
          című kérdésre
        </>
      );

    default:
      throw new Error("unknown activity type");
  }
}
