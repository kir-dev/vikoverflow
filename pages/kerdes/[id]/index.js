import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Question from "components/question";
import Layout from "components/layout";
import useSWR from "swr";
import Modal from "components/modal";
import Button from "components/button";
import { useUser } from "lib/authenticate";
import Link from "next/link";
import styles from "styles/pages/kerdes.module.css";
import Answer from "components/answer";
import AnswerForm from "components/answer-form";
import { useToasts } from "components/toasts";
import { trimLineBreaks } from "lib/utils";

const QuestionPage = () => {
  const router = useRouter();
  const questionId = router.query.id;
  const { data, mutate } = useSWR(
    questionId ? `/api/questions/${questionId}` : null
  );
  const { user } = useUser();
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    loading: false,
  });
  const [answerDeleteModal, setAnswerDeleteModal] = useState({
    id: null,
    open: false,
    loading: false,
  });
  const { addToast } = useToasts();
  const [editingAnswer, setEditingAnswer] = useState(null);

  useEffect(() => {
    if (!data) return;

    if (!data.question) {
      router.push("/404");
    }
  }, [data]);

  const closeDeleteModal = () => {
    if (deleteModal.loading) return;
    setDeleteModal({ open: false, loading: false });
  };

  const openDeleteModal = () => {
    setDeleteModal({
      open: true,
    });
  };

  const closeAnswerDeleteModal = () => {
    if (answerDeleteModal.loading) return;

    setAnswerDeleteModal({ open: false, loading: false, id: null });
  };

  const openAnswerDeleteModal = (id) => () => {
    setAnswerDeleteModal({ open: true, id });
  };

  async function handleAnswer(values) {
    const res = await fetch(`/api/questions/${questionId}/answers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      mutate((oldData) => ({
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
    } else {
      addToast("Hiba lépett fel a válaszod beküldése közben.", {
        errored: true,
      });
    }
  }

  async function handleAnswerEdit(values) {
    const res = await fetch(
      `/api/questions/${questionId}/answers/${editingAnswer}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: values.body }),
      }
    );

    if (res.ok) {
      mutate((oldData) => ({
        question: {
          ...oldData.question,
          answers: {
            ...oldData.question.answers,
            list: oldData.question.answers.list.map((a) =>
              a.id === editingAnswer
                ? { ...a, body: trimLineBreaks(values.body) }
                : a
            ),
          },
        },
      }));
      setEditingAnswer(null);
      addToast("A válaszod sikeresen szerkesztve.");
    } else {
      // TODO a toast nem latszik ha a modal még nyitva van, inkabb a modalba irni a hibat.
      addToast("Hiba lépett fel a válaszod szerkesztése közben.", {
        errored: true,
      });
    }
  }

  const handleDeleteModalSubmit = async () => {
    try {
      setDeleteModal((deleteModal) => ({ ...deleteModal, loading: true }));

      const res = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/");
      }
    } catch (e) {
      addToast("Hiba lépett fel a kérdésed törlése közben.", {
        errored: true,
      });
    } finally {
      setDeleteModal((deleteModal) => ({ ...deleteModal, loading: false }));
    }
  };

  const handleVote = (upvote) => async () => {
    try {
      mutate(({ question: oldQuestion }) => {
        return {
          question: {
            ...oldQuestion,
            upvotes: {
              count: oldQuestion.upvotes.count + (upvote ? 1 : -1),
              currentUserUpvoted: upvote,
            },
          },
        };
      }, false);

      const res = await fetch(`/api/questions/${questionId}/votes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upvote }),
      });

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

  function handleAnswerVote(answerId, upvote) {
    return async function answerVoteCallback() {
      try {
        mutate(({ question: oldQuestion }) => {
          return {
            question: {
              ...oldQuestion,
              answers: {
                count: oldQuestion.answers.count,
                list: oldQuestion.answers.list.map((a) => {
                  if (a.id !== answerId) return a;

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
        }, false);

        const res = await fetch(
          `/api/questions/${questionId}/answers/${answerId}/votes`,
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
        mutate(({ question: oldQuestion }) => {
          return {
            question: {
              ...oldQuestion,
              answers: {
                count: oldQuestion.answers.count - 1,
                list: oldQuestion.answers.list.filter((a) => a.id !== answerId),
              },
            },
          };
        }, false);
        addToast("A válaszod sikeresen törlésre került.");
        closeAnswerDeleteModal();
      } else {
        mutate();
        throw new Error("request failed");
      }
    } catch (e) {
      // TODO a toast nem latszik ha a modal még nyitva van, inkabb a modalba irni a hibat.
      addToast("Hiba lépett fel a válaszod törlése közben.", {
        errored: true,
      });
    } finally {
      setAnswerDeleteModal((oldVal) => ({ ...oldVal, loading: false }));
    }
  }

  return (
    <>
      <Modal open={deleteModal.open} onClose={closeDeleteModal}>
        <Modal.Header>Kérdés törlése</Modal.Header>
        <Modal.Body>
          <p>
            Biztosan törlöd a(z) "<b>{data?.question?.title}</b>" című
            kérdésedet?
            <br />A kérdés és a válaszok sem lesznek később visszaállíthatóak.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Action onClick={closeDeleteModal}>Nem</Modal.Action>
          <Modal.Action
            loading={deleteModal.loading}
            onClick={handleDeleteModalSubmit}
          >
            Igen
          </Modal.Action>
        </Modal.Footer>
      </Modal>

      <Modal open={answerDeleteModal.open} onClose={closeAnswerDeleteModal}>
        <Modal.Header>Válasz törlése</Modal.Header>
        <Modal.Body>
          <p>
            Biztosan törlöd a válaszodat?
            <br />A válasz nem lesz visszaállítható.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Action onClick={closeAnswerDeleteModal}>Nem</Modal.Action>
          <Modal.Action
            loading={answerDeleteModal.loading}
            onClick={handleAnswerDelete}
          >
            Igen
          </Modal.Action>
        </Modal.Footer>
      </Modal>

      <Layout footer={false}>
        <div className={styles.root}>
          <Question
            skeleton={!data}
            {...data?.question}
            allowActions={data && user}
            onUpvoteClick={handleVote(
              data?.question?.upvotes?.currentUserUpvoted === false
                ? true
                : false
            )}
          />

          <div className={styles.actions}>
            {data && user && (
              <>
                {user?.id === data?.question?.creator && (
                  <div className={styles.ownerActions}>
                    <Link
                      href="/kerdes/[id]/szerkesztes"
                      as={`/kerdes/${questionId}/szerkesztes`}
                    >
                      <Button medium>Szerkesztés</Button>
                    </Link>
                    <Button
                      onClick={openDeleteModal}
                      medium
                      style={{ marginLeft: "0.5rem" }}
                    >
                      Törlés
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {data?.question?.answers &&
            (data.question.answers.count > 0 ? (
              <div className={styles.answers}>
                {data.question.answers.list.map((a) => (
                  <Answer
                    {...a}
                    editing={editingAnswer === a.id}
                    onCancelEdit={() => setEditingAnswer(null)}
                    onEdit={handleAnswerEdit}
                    allowActions={data && user}
                    onUpvoteClick={handleAnswerVote(
                      a.id,
                      a.upvotes.currentUserUpvoted ? false : true
                    )}
                    actions={
                      a.creator === user?.id ? (
                        <>
                          <Button small onClick={() => setEditingAnswer(a.id)}>
                            Szerkesztés
                          </Button>
                          <Button small onClick={openAnswerDeleteModal(a.id)}>
                            Törlés
                          </Button>
                        </>
                      ) : null
                    }
                  />
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <h1>Még nem érkeztek válaszok</h1>
              </div>
            ))}
          {data && user && (
            <div className={styles.inputWrapper}>
              <AnswerForm onSubmit={handleAnswer} />
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default QuestionPage;
