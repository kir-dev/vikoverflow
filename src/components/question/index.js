import { useRouter } from "next/router";
import { useToasts } from "components/toasts";
import { useUser } from "lib/authenticate";
import useSWR, { mutate } from "swr";
import { useState } from "react";
import Modal from "components/modal";
import Tooltip from "components/tooltip";
import Button, { KIND } from "components/button";
import { Hearth, Attachment, Edit, Delete, Comment } from "components/icons";
import Linkify from "components/linkify";
import styles from "./question.module.css";
import Avatar from "components/avatar";
import dayjs from "lib/dayjs";
import cn from "clsx";
import Link from "next/link";

export default function Question({
  id,
  title,
  body,
  attachment,
  upvotes,
  answers,
  topics,
  createdAt,
  creator,
  skeleton,
}) {
  const router = useRouter();
  const { addToast } = useToasts();
  const { user } = useUser();
  const { data: creatorData } = useSWR(creator ? `/api/user/${creator}` : null);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    loading: false,
  });

  const openDeleteModal = () => {
    setDeleteModal({
      open: true,
    });
  };

  const closeDeleteModal = () => {
    if (deleteModal.loading) return;
    setDeleteModal({ open: false, loading: false });
  };

  const handleDeleteModalSubmit = async () => {
    try {
      setDeleteModal((deleteModal) => ({
        ...deleteModal,
        loading: true,
        error: false,
      }));

      const res = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        mutate(
          "/api/questions",
          (oldData) => ({
            ...oldData,
            questions: oldData?.questions?.length
              ? oldData.questions.filter((e) => e.id !== id)
              : [],
          }),
          false
        );
        router.push("/");
      }
    } catch (e) {
      setDeleteModal((old) => ({
        ...old,
        error: "Hiba lépett fel a kérdésed törlése közben.",
      }));
    } finally {
      setDeleteModal((deleteModal) => ({ ...deleteModal, loading: false }));
    }
  };

  const handleVote = (upvote) => async () => {
    try {
      mutate(
        `/api/questions/${id}`,
        ({ question: oldQuestion }) => {
          return {
            question: {
              ...oldQuestion,
              upvotes: {
                count: oldQuestion.upvotes.count + (upvote ? 1 : -1),
                currentUserUpvoted: upvote,
              },
            },
          };
        },
        false
      );

      const res = await fetch(`/api/questions/${id}/votes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upvote }),
      });

      if (!res.ok) {
        mutate(`/api/questions/${id}`);
        throw new Error("request failed");
      }
    } catch (e) {
      addToast("Hiba lépett fel a szavazatod leadása közben.", {
        errored: true,
      });
      mutate(`/api/questions/${id}`);
    }
  };

  if (skeleton) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.creator}>
            <Avatar skeleton size={32} />
          </div>
        </div>

        <div className={cn(styles.body, styles.skeleton)} />

        <div className={styles.footer}>
          <div className={styles.actions}>
            <div className={styles.action}>
              <Hearth />
              <span className={styles.hidden}>0</span>
            </div>
            <div className={styles.action}>
              <Comment />
              <span className={styles.hidden}>0</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Modal open={deleteModal.open} onClose={closeDeleteModal}>
        <Modal.Header title="Törlés megerősítése" />
        <Modal.Body>
          <p>
            Biztosan törlöd a kérdésedet?
            <br />A kérdés és a válaszok sem lesznek később visszaállíthatóak.
          </p>
          {deleteModal.error && (
            <p className={styles.modalError}>{deleteModal.error}</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={deleteModal.loading}
            kind={KIND.secondary}
            onClick={closeDeleteModal}
          >
            Nem
          </Button>
          <Button
            disabled={deleteModal.loading}
            onClick={handleDeleteModalSubmit}
          >
            Igen
          </Button>
        </Modal.Footer>
      </Modal>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.creator}>
            <Avatar
              loading={!creatorData?.user}
              id={creatorData?.user?.avatar}
              size={32}
              onClick={() => router.push(`/profil/${creator}`)}
              label="Profil megtekintése"
            />
            <div className={styles.creatorInfo}>
              <Tooltip label="Profil megtekintése">
                <p onClick={() => router.push(`/profil/${creator}`)}>
                  {creatorData?.user?.name}
                </p>
              </Tooltip>

              <Tooltip
                label={dayjs(new Date(createdAt)).format("YYYY. MMMM D. HH:mm")}
              >
                <p>{dayjs(new Date(createdAt)).fromNow()}</p>
              </Tooltip>
            </div>
          </div>

          {user?.id === creator && (
            <div className={styles.headerActions}>
              <Button
                kind={KIND.icon}
                tooltip="Kérdés szerkesztése"
                onClick={() => router.push(`/kerdes/${id}/szerkesztes`)}
                data-test="editQuestionButton"
              >
                <Edit />
              </Button>
              <Button
                kind={KIND.icon}
                tooltip="Kérdés törlése"
                onClick={openDeleteModal}
                data-test="deleteQuestionButton"
              >
                <Delete />
              </Button>
            </div>
          )}
        </div>

        <div className={styles.body}>
          <h1>{title}</h1>
          <p>
            <Linkify>{body}</Linkify>
          </p>
          {attachment && (
            <Tooltip label="Csatolmány megtekintése">
              <a
                href={`${process.env.NEXT_PUBLIC_S3_URL}/${attachment.s3Key}`}
                target="_blank"
                rel="noopener"
                className={styles.attachment}
              >
                <Attachment />
                <span>{attachment.originalName}</span>
              </a>
            </Tooltip>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.actions}>
            <div className={styles.action}>
              {user ? (
                <Button
                  kind={KIND.icon}
                  tooltip={
                    upvotes.currentUserUpvoted ? "Nem tetszik" : "Tetszik"
                  }
                  onClick={handleVote(!upvotes.currentUserUpvoted)}
                >
                  <Hearth fill={upvotes.currentUserUpvoted} />
                </Button>
              ) : (
                <Hearth fill={upvotes.currentUserUpvoted} />
              )}
              <span>{upvotes.count}</span>
            </div>
            <div className={styles.action}>
              <Comment />

              <span>{answers.count}</span>
            </div>
          </div>
          <div className={styles.topics}>
            {topics.map((topic, i) => (
              <>
                <Tooltip label="Téma megtekintése">
                  <p className={styles.topic}>
                    <Link href={`/tema/${topic}`}>
                      <a>#{topic}</a>
                    </Link>
                  </p>
                </Tooltip>
                {i !== topics.length - 1 && <p>,&nbsp;</p>}
              </>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
