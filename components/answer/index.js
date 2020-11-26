import { useRouter } from "next/router";
import { useToasts } from "components/toasts";
import { useUser } from "lib/authenticate";
import useSWR, { mutate } from "swr";
import { useState } from "react";
import Modal from "components/modal";
import Tooltip from "components/tooltip";
import Button, { KIND } from "components/button";
import { Hearth, Edit, Delete, Attachment } from "components/icons";
import styles from "./answer.module.css";
import Avatar from "components/avatar";
import dayjs from "lib/dayjs";
import cn from "clsx";
import AnswerForm from "components/answer-form";
import Linkify from "components/linkify";

export default function Answer({
  questionId,
  id,
  creator,
  createdAt,
  body,
  upvotes,
  skeleton,
  attachment,
}) {
  const router = useRouter();
  const { addToast } = useToasts();
  const { user } = useUser();
  const { data: creatorData } = useSWR(creator ? `/api/user/${creator}` : null);
  const [isEditing, setIsEditing] = useState(false);

  const [answerDeleteModal, setAnswerDeleteModal] = useState({
    id: null,
    open: false,
    loading: false,
  });

  async function handleAnswerDelete() {
    try {
      setAnswerDeleteModal((oldVal) => ({
        ...oldVal,
        loading: true,
        error: "",
      }));

      const answerId = answerDeleteModal.id;

      const res = await fetch(
        `/api/questions/${questionId}/answers/${answerId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        mutate(
          `/api/questions/${questionId}`,
          ({ question: oldQuestion }) => {
            return {
              question: {
                ...oldQuestion,
                answers: {
                  count: oldQuestion.answers.count - 1,
                  list: oldQuestion.answers.list.filter(
                    (a) => a.id !== answerId
                  ),
                },
              },
            };
          },
          false
        );
        addToast("A válaszod sikeresen törlésre került.");
        closeAnswerDeleteModal();
      } else {
        mutate();
        throw new Error("request failed");
      }
    } catch (e) {
      setAnswerDeleteModal((old) => ({
        ...old,
        error: "Hiba lépett fel a válaszod törlése közben.",
      }));
    } finally {
      setAnswerDeleteModal((oldVal) => ({ ...oldVal, loading: false }));
    }
  }

  const openAnswerDeleteModal = (id) => () => {
    setAnswerDeleteModal({ open: true, id });
  };

  const closeAnswerDeleteModal = () => {
    if (answerDeleteModal.loading) return;

    setAnswerDeleteModal({ open: false, loading: false, id: null });
  };

  function handleAnswerVote(upvote) {
    return async function answerVoteCallback() {
      try {
        mutate(
          `/api/questions/${questionId}`,
          ({ question: oldQuestion }) => {
            return {
              question: {
                ...oldQuestion,
                answers: {
                  count: oldQuestion.answers.count,
                  list: oldQuestion.answers.list.map((a) => {
                    if (a.id !== id) return a;

                    return {
                      ...a,
                      upvotes: {
                        count: a.upvotes.count + (upvote ? 1 : -1),
                        currentUserUpvoted: upvote,
                      },
                    };
                  }),
                },
              },
            };
          },
          false
        );

        const res = await fetch(
          `/api/questions/${questionId}/answers/${id}/votes`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ upvote }),
          }
        );

        if (!res.ok) {
          mutate();
          throw new Error("request failed");
        }
      } catch (e) {
        addToast("Hiba lépett fel a szavazatod leadása közben.", {
          errored: true,
        });
        mutate();
      }
    };
  }

  if (isEditing) {
    return (
      <AnswerForm
        questionId={questionId}
        answerId={id}
        initialValues={{ body, attachment }}
        onCancel={() => setIsEditing(false)}
        onSubmit={() => setIsEditing(false)}
      />
    );
  }

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
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Modal open={answerDeleteModal.open} onClose={closeAnswerDeleteModal}>
        <Modal.Header title="Törlés megerősítése" />
        <Modal.Body>
          <p>
            Biztosan törlöd a válaszodat?
            <br />A válasz nem lesz visszaállítható.
          </p>
          {answerDeleteModal.error && (
            <p className={styles.modalError}>{answerDeleteModal.error}</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={answerDeleteModal.loading}
            kind={KIND.secondary}
            onClick={closeAnswerDeleteModal}
          >
            Nem
          </Button>
          <Button
            disabled={answerDeleteModal.loading}
            onClick={handleAnswerDelete}
          >
            Igen
          </Button>
        </Modal.Footer>
      </Modal>
      <div key={id} className={styles.container}>
        <div className={styles.header}>
          <div className={styles.creator}>
            <Avatar
              loading={!creatorData?.user}
              id={creatorData?.user?.avatar}
              size={32}
              onClick={() => router.push(`/profil/${creator}`)}
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
                tooltip="Válasz szerkesztése"
                onClick={() => setIsEditing(true)}
              >
                <Edit />
              </Button>
              <Button
                kind={KIND.icon}
                tooltip="Válasz törlése"
                onClick={openAnswerDeleteModal(id)}
              >
                <Delete />
              </Button>
            </div>
          )}
        </div>

        <div className={styles.body}>
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
                  onClick={handleAnswerVote(!upvotes.currentUserUpvoted)}
                >
                  <Hearth fill={upvotes.currentUserUpvoted} />
                </Button>
              ) : (
                <Hearth fill={upvotes.currentUserUpvoted} />
              )}

              <span>{upvotes.count}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
