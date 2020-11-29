import { useMemo, useState, useRef, useEffect } from "react";
import styles from "./answer-form.module.css";
import { getAnswerSchema } from "lib/schemas";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { trimLineBreaks } from "lib/utils";
import { useToasts } from "components/toasts";
import { useUser } from "lib/authenticate";
import useSWR, { mutate } from "swr";
import Button, { KIND } from "components/button";
import Avatar from "components/avatar";
import cn from "classnames";
import Error from "components/error";
import { Attachment, X } from "components/icons";
import { DELETE_CURRENT_FILE } from "lib/constants";

export default function AnswerForm({
  questionId,
  answerId,
  initialValues,
  onCancel,
  onSubmit,
  skeleton,
}) {
  const [focused, setFocused] = useState(false);
  const { addToast } = useToasts();
  const { user, isLoading: isUserLoading } = useUser();
  const { data: userData } = useSWR(
    !isUserLoading && user ? `/api/user/${user.id}` : null
  );
  const editorRef = useRef(null);
  const attachmentButtonRef = useRef(null);
  const fileInputRef = useRef(null);

  const validationSchema = useMemo(
    () => getAnswerSchema(Boolean(initialValues)),
    [initialValues]
  );

  const {
    handleSubmit,
    errors,
    formState,
    reset,
    watch,
    control,
    clearErrors,
    setError,
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });
  const { isDirty, isValid, isSubmitting } = formState;

  useEffect(() => {
    if (initialValues) {
      editorRef.current.innerText = initialValues.body;
    }

    reset({
      body: initialValues?.body ?? "",
      file: initialValues?.attachment?.originalName
        ? { name: initialValues.attachment.originalName }
        : "",
    });
  }, [initialValues]);

  function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").trim();
    document.execCommand("insertText", false, text);
  }

  const body = watch("body", initialValues?.body);
  const watchFile = watch("file");

  async function submitThenReset(values) {
    try {
      await handleAnswer(values);
      reset();
      if (editorRef?.current) {
        editorRef.current.innerHTML = "";
      }
    } catch (e) {
      // no-op, alreay handled in handleAnswer
    }
  }

  async function handleAnswer(values) {
    try {
      const formData = new FormData();

      for (const [key, value] of Object.entries(values)) {
        formData.append(key, value);
      }

      const res = await fetch(
        initialValues
          ? `/api/questions/${questionId}/answers/${answerId}`
          : `/api/questions/${questionId}/answers`,
        {
          method: initialValues ? "PATCH" : "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("fetch failed");
      }

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
                  createdAt: Date.now(),
                },
                ...oldData.question.answers.list,
              ],
            },
          },
        }));
      }
    } catch (e) {
      addToast("Hiba lépett fel a válaszod beküldése közben.");
      throw e;
    }
  }

  function handleUploadButtonClick() {
    fileInputRef.current.click();
  }

  if (skeleton) {
    return (
      <div className={styles.answerForm}>
        <div className={styles.answerFormContent}>
          <Avatar skeleton size={32} />
        </div>
      </div>
    );
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
        <div className={styles.inputWrapper}>
          <Controller
            control={control}
            name="body"
            render={({ onChange, onBlur }) => (
              <div
                contentEditable
                onPaste={handlePaste}
                ref={editorRef}
                placeholder="Írd be a válaszod..."
                className={cn(styles.input, {
                  [styles.empty]: !body,
                  [styles.errored]: errors?.body?.message,
                })}
                onFocus={() => setFocused(true)}
                onBlur={(e) => {
                  if (!(e?.relatedTarget === attachmentButtonRef?.current)) {
                    setFocused(false);
                    onBlur();
                  }
                }}
                onInput={(e) => {
                  onChange(e.currentTarget.innerText);
                }}
              />
            )}
          />
          <Controller
            name="file"
            control={control}
            render={({ value, onChange }) => (
              <>
                {value?.name && (
                  <div className={styles.attachment}>
                    <p className={styles.fileName}>{value.name}</p>
                    <Button
                      kind={KIND.icon}
                      disabled={isSubmitting}
                      small
                      type="button"
                      onClick={() => {
                        fileInputRef.current.value = null;
                        onChange(
                          initialValues?.attachment ? DELETE_CURRENT_FILE : ""
                        );
                      }}
                    >
                      <X />
                    </Button>
                  </div>
                )}

                <input
                  className={styles.fileInput}
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];

                    if (!file) {
                      clearErrors("fileSize");
                      onChange("");
                    } else if (file.size > 1024 * 1024 * 5) {
                      setError("fileSize", {
                        type: "manual",
                        message: "5 MB a maximális fájlméret",
                      });
                    } else {
                      clearErrors("fileSize");
                      onChange(e.target.files[0]);
                    }
                  }}
                />
              </>
            )}
          />
          {errors?.body?.message && <Error>{errors.body.message}</Error>}
          {errors?.fileSize?.message && (
            <Error>{errors.fileSize.message}</Error>
          )}
        </div>
        {(focused || body || errors?.body?.message) && (
          <div className={styles.answerFormActions}>
            <div className={styles.submitButtons}>
              <Button
                kind={KIND.icon}
                type="button"
                tooltip="Csatolmány hozzáadása"
                tabIndex="0"
                ref={attachmentButtonRef}
                onClick={handleUploadButtonClick}
                disabled={watchFile && watchFile !== DELETE_CURRENT_FILE}
              >
                <Attachment />
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !(isValid && isDirty)}
              >
                {initialValues ? "Mentés" : "Küldés"}
              </Button>
            </div>
            {initialValues && (
              <Button type="button" onClick={onCancel} kind={KIND.secondary}>
                Mégsem
              </Button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
