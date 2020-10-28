import Layout from "components/layout";
import styles from "styles/pages/tema.module.css";
import useSWR, { useSWRInfinite, mutate } from "swr";
import Avatar from "components/avatar";
import dayjs from "lib/dayjs";
import tempQuestionStyles from "styles/pages/newindexquestion.module.css";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";
import { Comment, Hearth } from "components/icons";
import Button, { KIND } from "components/button";
import { Edit, Plus } from "components/icons";
import { useRouter } from "next/router";
import { useUser } from "lib/authenticate";
import Modal from "components/modal";
import Textarea from "components/textarea";
import { TopicDescriptionSchema } from "lib/schemas";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

export default function TopicPage() {
  const { user } = useUser();
  const router = useRouter();
  const topicId = router.query.id;
  const { data: topicData } = useSWR(topicId ? `/api/topics/${topicId}` : null);
  const { data, size, setSize } = useSWRInfinite((index, prevData) => {
    if (prevData && !prevData.nextCursor) return null;

    if (index === 0) return `/api/questions`;

    return `/api/questions?cursor=${prevData.nextCursor}&cursor2=${prevData.nextCursor2}`;
  });

  const [loaderRef, inView] = useInView({ rootMargin: "400px 0px" });

  const [editModal, setEditModal] = useState({
    open: false,
    loading: false,
  });

  const { register, handleSubmit, errors, formState, reset } = useForm({
    resolver: yupResolver(TopicDescriptionSchema),
    mode: "onChange",
  });
  const { isDirty, isValid, isSubmitting } = formState;

  const openEditModal = () => {
    setEditModal({
      open: true,
      loading: false,
    });
  };

  const closeEditModal = () => {
    if (editModal.loading) return;
    setEditModal({ open: false, loading: false });
  };

  async function handleDescriptionEdit(values) {
    setEditModal((oldVal) => ({ ...oldVal, loading: true }));
    const res = await fetch(`/api/topics/${topicId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description: values.description }),
    });

    if (res.ok) {
      mutate(
        `/api/topics/${topicId}`,
        (oldData) => ({
          topic: { ...oldData.topic, description: values.description },
        }),
        false
      );
      setEditModal({ open: false, loading: false });
      // TODO show error in modal
      // addToast("Sikeresen módosítottad a téma leírását.");
    } else {
      setEditModal((oldVal) => ({ ...oldVal, loading: false }));
      // TODO show error in modal
      // addToast("Hiba lépett fel a téma leírás módosítása közben.", {
      //   errored: true,
      // });
    }
  }

  useEffect(() => {
    if (!topicData) return;

    if (!topicData.topic) {
      router.push("/404");
    }

    reset({ description: topicData?.topic?.description ?? "" });
  }, [topicData]);

  const isErrored = data?.some((p) => !!p.error);
  const isReachingEnd = data && !data[data.length - 1]?.nextCursor;
  const questions =
    data && !isErrored
      ? [].concat(...data.map((page) => page.questions))
      : null;

  useEffect(() => {
    if (inView && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [inView, isReachingEnd]);

  if (!questions) {
    return <Layout />;
  }

  return (
    <>
      <Modal open={editModal.open} onClose={closeEditModal}>
        <form onSubmit={handleSubmit(handleDescriptionEdit)}>
          <Modal.Body>
            <div className={styles.modalBody}>
              <p>
                Mivel te voltál ennek a témának a létrehozója lehetőséged van
                módosítani a téma leírását.
              </p>
              <Textarea
                name="description"
                rows={3}
                placeholder="Add meg a téma új leírását..."
                error={errors?.description?.message}
                ref={register}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              disabled={editModal.loading || isSubmitting}
              kind={KIND.secondary}
              onClick={closeEditModal}
            >
              Mégsem
            </Button>
            <Button
              disabled={editModal.loading}
              onClick={handleDescriptionEdit}
              disabled={isSubmitting || !(isValid && isDirty)}
              loading={isSubmitting}
              type="submit"
            >
              Mentés
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
      <Layout>
        <div className={styles.root}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <h1>{topicData?.topic?.id}</h1>
              <h2>{topicData?.topic?.description}</h2>
            </div>
            <div className={styles.headerActions}>
              {user && (
                <Button
                  kind={KIND.icon}
                  onClick={() =>
                    router.push(`/uj?tema=${topicData?.topic?.id}`)
                  }
                  tooltip="Új kérdés hozzáadása a témához"
                >
                  <Plus />
                </Button>
              )}

              {user && topicData?.topic?.creator === user.id && (
                <Button
                  kind={KIND.icon}
                  tooltip="A téma leírásának szerkesztése"
                  onClick={openEditModal}
                >
                  <Edit />
                </Button>
              )}
            </div>
          </header>
          <main className={styles.main}>
            {questions.map((q) => (
              <Question {...q} />
            ))}
            {!isReachingEnd && <div ref={loaderRef}>loader div</div>}
          </main>
        </div>
      </Layout>
    </>
  );
}

function Question({
  id,
  title,
  body,
  upvotes,
  answers,
  topic,
  createdAt,
  creator,
}) {
  const { data: creatorData } = useSWR(creator ? `/api/user/${creator}` : null);

  return (
    <div className={tempQuestionStyles.container}>
      <Link href={`/kerdes/${id}`}>
        <a className={tempQuestionStyles.overlay}></a>
      </Link>
      <div className={tempQuestionStyles.header}>
        <div className={tempQuestionStyles.creator}>
          <Avatar
            loading={!creatorData?.user}
            id={creatorData?.user?.avatar}
            size={32}
            onClick={() => router.push("/profil/[id]", `/profil/${creator}`)}
          />
          <div className={tempQuestionStyles.creatorInfo}>
            <p>{creatorData?.user?.name}</p>
            <p>{dayjs(new Date(createdAt)).fromNow()}</p>
          </div>
        </div>
      </div>

      <div className={tempQuestionStyles.body}>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>

      <div className={tempQuestionStyles.footer}>
        <div className={tempQuestionStyles.actions}>
          <div className={tempQuestionStyles.action}>
            <Hearth fill={upvotes.currentUserUpvoted} />
            <span>{upvotes.count}</span>
          </div>
          <div className={tempQuestionStyles.action}>
            <Comment />

            <span>{answers.count}</span>
          </div>
        </div>
        <p className={tempQuestionStyles.topic}>#{topic}</p>
      </div>
    </div>
  );
}
