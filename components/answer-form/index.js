import { forwardRef, useMemo } from "react";
import Textarea from "components/textarea";
import styles from "./answer-form.module.css";
import { getAnswerSchema } from "lib/schemas";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { trimLineBreaks } from "lib/utils";
import { useToasts } from "components/toasts";
import { useUser } from "lib/authenticate";
import useSWR, { mutate } from "swr";
import Button, { KIND } from "components/button";
import Avatar from "components/avatar";

export default function AnswerForm({
  questionId,
  answerId,
  initialValues,
  onCancel,
  onSubmit,
}) {
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
    defaultValues: initialValues ? { body: initialValues.body } : { body: "" },
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
        />
        <Textarea
          name="body"
          placeholder="Írd be a válaszod..."
          rows={5}
          ref={register}
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
