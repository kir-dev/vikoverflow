import useSWR, { useSWRInfinite, mutate } from "swr";
import { useRouter } from "next/router";
import Layout from "components/layout";
import { useState, useEffect } from "react";
import styles from "styles/pages/tema.module.css";
import Question from "components/question";
import Button from "components/button";
import Link from "next/link";
import { useUser } from "lib/authenticate";
import { useInView } from "react-intersection-observer";
import Skeleton from "components/skeleton";
import Modal from "components/modal";
import Textarea from "components/textarea";
import { useToasts } from "components/toasts";
import { TopicDescriptionSchema } from "lib/schemas";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers";

// TODO az empty text containerje rossz szelessegu es mobilon is van borderje

export default function TopicPage() {
  const { user } = useUser();
  const router = useRouter();
  const topicId = router.query.id;
  const { data: topicData } = useSWR(topicId ? `/api/topics/${topicId}` : null);
  const { data, size, setSize } = useSWRInfinite((index, prevData) => {
    if ((prevData && !prevData.nextCursor) || !topicData?.topic?.id)
      return null;

    if (index === 0) return `/api/questions?topic=${topicData.topic.id}`;

    return `/api/questions?topic=${topicData.topic.id}&cursor=${prevData.nextCursor}&cursorCreatedAt=${prevData.nextCursorCreatedAt}`;
  });
  const [loaderRef, inView] = useInView({ rootMargin: "400px 0px" });
  const [editDescriptionModal, setEditDescriptionModal] = useState({
    open: false,
    loading: false,
  });
  const { addToast } = useToasts();

  function openEditDescriptionModal() {
    setEditDescriptionModal({ open: true, loading: false });
  }

  function closeEditDescriptionModal() {
    if (editDescriptionModal.loading) return;
    setEditDescriptionModal({ open: false, loading: false });
  }

  async function handleDescriptionEdit(values) {
    setEditDescriptionModal((oldVal) => ({ ...oldVal, loading: true }));
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
      closeEditDescriptionModal();
      addToast("Sikeresen módosítottad a téma leírását.");
    } else {
      setEditDescriptionModal((oldVal) => ({ ...oldVal, loading: false }));
      // TODO itt a modalban mutatni a hibat inkabb
      addToast("Hiba lépett fel a téma leírás módosítása közben.", {
        errored: true,
      });
    }
  }

  const isErrored = data?.some((p) => !!p.error);
  const isReachingEnd = data && !data[data.length - 1]?.nextCursor;
  const questions =
    data && !isErrored
      ? [].concat(...data.map((page) => page.questions))
      : null;

  const { register, handleSubmit, errors, formState, reset } = useForm({
    resolver: yupResolver(TopicDescriptionSchema),
    mode: "onChange",
  });
  const { isDirty, isValid, isSubmitting } = formState;

  useEffect(() => {
    if (inView && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [inView, isReachingEnd]);

  useEffect(() => {
    if (!topicData) return;

    if (!topicData.topic) {
      router.push("/404");
    }

    reset({ description: topicData.topic.description ?? "" });
  }, [topicData]);

  return (
    <>
      <Modal
        open={editDescriptionModal.open}
        onClose={closeEditDescriptionModal}
      >
        <form onSubmit={handleSubmit(handleDescriptionEdit)}>
          <Modal.Header>Téma leírásának módosítása</Modal.Header>
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
            <Modal.Action onClick={closeEditDescriptionModal} type="button">
              Mégsem
            </Modal.Action>
            <Modal.Action
              disabled={isSubmitting || !(isValid && isDirty)}
              loading={isSubmitting}
              type="submit"
            >
              Mentés
            </Modal.Action>
          </Modal.Footer>
        </form>
      </Modal>

      <Layout footer={false}>
        <div className={styles.root}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              {topicData?.topic ? (
                <>
                  <h1>{topicData?.topic?.id}</h1>
                  <p>{topicData?.topic?.description}</p>
                </>
              ) : (
                <>
                  <Skeleton
                    style={{ height: 47, marginBottom: 10, width: 200 }}
                  />
                  <Skeleton style={{ height: 18, width: 250 }} />
                </>
              )}
            </div>
            <div className={styles.headerActions}>
              {user && topicData?.topic?.creator === user.id && (
                <Button small onClick={openEditDescriptionModal}>
                  Téma leírásának módosítása
                </Button>
              )}

              <Link href={`/uj?tema=${topicData?.topic?.id}`}>
                <Button small disabled={!(user && topicData?.topic?.id)}>
                  Új kérdés ehhez a témához
                </Button>
              </Link>
            </div>
          </header>

          {isErrored ? (
            <div className={styles.empty}>
              <h1>Hiba lépett fel</h1>
            </div>
          ) : !questions ? (
            <div className={styles.questions}>
              <Question skeleton />
              <Question skeleton />
              <Question skeleton />
              <Question skeleton />
              <Question skeleton />
            </div>
          ) : questions.length > 0 ? (
            <div className={styles.questions}>
              {questions.map((q) => (
                <Question clickable key={q.id} {...q} />
              ))}
              {!isReachingEnd && <Question ref={loaderRef} skeleton />}
            </div>
          ) : (
            <div className={styles.empty}>
              <h1>Nem találtunk kérdéseket</h1>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
