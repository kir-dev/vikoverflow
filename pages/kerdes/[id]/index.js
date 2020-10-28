import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import styles from "styles/pages/question.module.css";
import Avatar from "components/avatar";
import Linkify from "components/linkify";
import Button, { KIND } from "components/button";
import Textarea from "components/textarea";
import { useUser } from "lib/authenticate";
import dayjs from "lib/dayjs";
import Layout from "components/layout";
import Tooltip from "components/tooltip";
import Modal from "components/modal";
import { useState, useRef, forwardRef, useEffect, useMemo } from "react";
import { useToasts } from "components/toasts";
import { getAnswerSchema } from "lib/schemas";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { trimLineBreaks } from "lib/utils";
import Error from "components/error";
import { Hearth, Delete, Edit, Comment, Attachment } from "components/icons";

// TODO skeleton

export default function QuestionPage() {
  const { user } = useUser();
  const router = useRouter();
  const questionId = router.query.id;
  const { data } = useSWR(questionId ? `/api/questions/${questionId}` : null);
  const answerFormRef = useRef(null);

  function handleCommentButtonClick() {
    answerFormRef?.current?.scrollIntoView();
    answerFormRef?.current?.focus();
  }

  useEffect(() => {
    if (!data) return;

    if (!data.question) {
      router.push("/404");
    }
  }, [data]);

  if (!data) {
    return <Layout />;
  }

  return (
    <Layout>
      <div className={styles.root}>
        <Question
          onCommentButtonClick={handleCommentButtonClick}
          {...data.question}
        />

        {data.question.answers.list.map((a) => (
          <Answer questionId={questionId} {...a} />
        ))}

        {user && <AnswerForm ref={answerFormRef} questionId={questionId} />}
      </div>
    </Layout>
  );
}

function Question({
  id,
  title,
  body,
  attachment,
  upvotes,
  answers,
  topic,
  createdAt,
  creator,
  onCommentButtonClick,
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
      setDeleteModal((deleteModal) => ({ ...deleteModal, loading: true }));

      const res = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/");
      }
    } catch (e) {
      addToast("Hiba lépett fel a kérdésed törlése közben.");
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

  return (
    <>
      <Modal open={deleteModal.open} onClose={closeDeleteModal}>
        <Modal.Body>
          <p>
            Biztosan törlöd a kérdésedet?
            <br />A kérdés és a válaszok sem lesznek később visszaállíthatóak.
          </p>
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
              onClick={() => router.push("/profil/[id]", `/profil/${creator}`)}
            />
            <div className={styles.creatorInfo}>
              <p>{creatorData?.user?.name}</p>
              <p>{dayjs(new Date(createdAt)).fromNow()}</p>
            </div>
          </div>
          {user?.id === creator && (
            <div className={styles.headerActions}>
              <Button
                kind={KIND.icon}
                tooltip="Kérdés szerkesztése"
                onClick={() => router.push(`/kerdes/${id}/szerkesztes`)}
              >
                <Edit />
              </Button>
              <Button
                kind={KIND.icon}
                tooltip="Kérdés törlése"
                onClick={openDeleteModal}
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
              {user ? (
                <Button
                  kind={KIND.icon}
                  tooltip={"Válasz írása"}
                  onClick={onCommentButtonClick}
                >
                  <Comment />
                </Button>
              ) : (
                <Comment />
              )}

              <span>{answers.count}</span>
            </div>
          </div>
          <p className={styles.topic}>#{topic}</p>
        </div>
      </div>
    </>
  );
}

function Answer({ questionId, id, creator, createdAt, body, upvotes }) {
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
      setAnswerDeleteModal((oldVal) => ({ ...oldVal, loading: true }));

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
      addToast("Hiba lépett fel a válaszod törlése közben.", {
        errored: true,
      });
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
        initialValues={{ body }}
        onCancel={() => setIsEditing(false)}
        onSubmit={() => setIsEditing(false)}
      />
    );
  }

  return (
    <>
      <Modal open={answerDeleteModal.open} onClose={closeAnswerDeleteModal}>
        <Modal.Body>
          <p>
            Biztosan törlöd a válaszodat?
            <br />A válasz nem lesz visszaállítható.
          </p>
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
              onClick={() => router.push("/profil/[id]", `/profil/${creator}`)}
            />
            <div className={styles.creatorInfo}>
              <p>{creatorData?.user?.name}</p>
              <p>{dayjs(new Date(createdAt)).fromNow()}</p>
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
          <p>{body}</p>
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

const AnswerForm = forwardRef(
  ({ questionId, answerId, initialValues, onCancel, onSubmit }, ref) => {
    const router = useRouter();
    const { addToast } = useToasts();
    const { user, isLoading: isUserLoading } = useUser();
    const { data: userData } = useSWR(
      !isUserLoading && user ? `/api/user/${user.id}` : null
    );

    const validationSchema = useMemo(
      () => getAnswerSchema(Boolean(initialValues)),
      [initialValues]
    );

    const { register, handleSubmit, errors, formState, reset } = useForm({
      defaultValues: initialValues
        ? { body: initialValues.body }
        : { body: "" },
      resolver: yupResolver(validationSchema),
      mode: "onChange",
    });
    const { isDirty, isValid, isSubmitting } = formState;

    async function submitThenReset(values) {
      await handleAnswer(values);
      reset();
    }

    async function handleAnswer(values) {
      const res = await fetch(
        initialValues
          ? `/api/questions/${questionId}/answers/${answerId}`
          : `/api/questions/${questionId}/answers`,
        {
          method: initialValues ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      if (res.ok) {
        if (initialValues) {
          mutate(`/api/questions/${questionId}`, (oldData) => ({
            question: {
              ...oldData.question,
              answers: {
                ...oldData.question.answers,
                list: oldData.question.answers.list.map((a) =>
                  a.id === answerId
                    ? { ...a, body: trimLineBreaks(values.body) }
                    : a
                ),
              },
            },
          }));
          onSubmit();
          addToast("Sikeresen szerkesztetted válaszod.");
        } else {
          mutate(`/api/questions/${questionId}`, (oldData) => ({
            question: {
              ...oldData.question,
              answers: {
                count: oldData.question.answers.count + 1,
                list: [
                  {
                    body: trimLineBreaks(values.body),
                    upvotes: { count: 0, currentUserUpvoted: false },
                    creator: user.id,
                  },
                  ...oldData.question.answers.list,
                ],
              },
            },
          }));

          scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        addToast("Hiba lépett fel a válaszod beküldése közben.");
      }
    }

    return (
      <form
        onSubmit={handleSubmit(submitThenReset)}
        className={styles.answerForm}
      >
        <div className={styles.answerFormContent}>
          <Avatar
            loading={!userData?.user}
            id={userData?.user?.avatar}
            size={32}
            className={styles.avatar}
            onClick={() => router.push("/profil/[id]", `/profil/${user.id}`)}
          />
          <Textarea
            name="body"
            placeholder="Írd be a válaszod..."
            rows={5}
            ref={(innerRef) => {
              if (ref) {
                ref.current = innerRef;
              }
              register(innerRef);
            }}
            error={Boolean(errors?.body?.message)}
          />
        </div>
        <div className={styles.answerFormActions}>
          {errors?.body?.message && <Error>{errors.body.message}</Error>}

          {initialValues && (
            <Button onClick={onCancel} kind={KIND.secondary}>
              Mégsem
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !(isValid && isDirty)}
            loading={isSubmitting}
            inverted
          >
            Küldés
          </Button>
        </div>
      </form>
    );
  }
);
