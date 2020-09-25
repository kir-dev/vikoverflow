import Head from "next/head";
import Layout from "components/layout";
import { useUser } from "lib/authenticate";
import { UploadAvatar } from "components/avatar";
import styles from "styles/pages/profil.module.css";
import useSWR, { useSWRInfinite, mutate } from "swr";
import Input from "components/input";
import Button from "components/button";
import Link from "next/link";
import { ACTIVITY } from "lib/constants";
import { useToasts } from "components/toasts";
import { UserProfileSchema } from "lib/schemas";
import cn from "clsx";
import { trimSpaces } from "lib/utils";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user } = useUser("/belepes");
  const { data: userData } = useSWR(user?.id ? `/api/user/${user.id}` : "");
  const { data, size, setSize } = useSWRInfinite((index, prevData) => {
    if (prevData && !prevData.nextCursor) return null;

    if (index === 0) return `/api/user/activities`;

    return `/api/user/activities?cursorPK=${encodeURIComponent(
      prevData.nextCursor.PK
    )}&cursorSK=${encodeURIComponent(prevData.nextCursor.SK)}&cursorCreatedAt=${
      prevData.nextCursor.createdAt
    }`;
  });
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

  const isErrored = data?.some((p) => !!p.error);
  const isReachingEnd = data && !data[data.length - 1]?.nextCursor;
  const isLoadingMore =
    size > 0 && data && typeof data[size - 1] === "undefined";
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

      <Layout>
        <div className={styles.root}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <UploadAvatar size={102} />
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
                      label="név"
                    />
                    <Input
                      disabled
                      value={userData?.user?.email}
                      placeholder="E-mail címed..."
                      label="e-mail"
                    />
                    <Input
                      name="bio"
                      ref={register}
                      disabled={!userData?.user || isSubmitting}
                      placeholder="Rövid bemutatkozás, mely a profilodon fog megjelenni..."
                      label="bemutatkozás"
                      error={errors?.bio?.message}
                    />
                  </div>
                  <div className={styles.footer}>
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
                    <Button
                      type="submit"
                      disabled={isSubmitting || !(isValid && isDirty)}
                      loading={isSubmitting}
                      inverted
                    >
                      Mentés
                    </Button>
                  </div>
                </form>
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
                    onClick={() => !isLoadingMore && setSize(size + 1)}
                    className={cn(styles.loadMore, {
                      [styles.loading]: isLoadingMore,
                    })}
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
