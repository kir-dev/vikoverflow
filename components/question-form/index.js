import styles from "./question-form.module.css";
import Button from "components/button";
import Input from "components/input";
import Textarea from "components/textarea";
import useSWR from "swr";
import { useState, useMemo, useRef, useEffect } from "react";
import Autocomplete from "components/autocomplete";
import { getQuestionSchema } from "lib/schemas";
import cn from "clsx";
import { DELETE_CURRENT_FILE } from "lib/constants";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers";
import Error from "components/error";

export default function QuestionForm({
  initialValues,
  onSubmit,
  message,
  buttonText,
  skeleton,
}) {
  const [isTopicNew, setIsTopicNew] = useState(false);
  const { data } = useSWR("/api/topics");
  const validationSchema = useMemo(() => getQuestionSchema(isTopicNew), [
    isTopicNew,
  ]);
  const fileInputRef = useRef(null);
  const {
    register,
    handleSubmit,
    formState,
    errors,
    control,
    reset,
    setError,
    clearErrors,
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  useEffect(() => {
    reset({
      title: initialValues?.title ?? "",
      body: initialValues?.body ?? "",
      topic: initialValues?.topic ?? "",
      file: initialValues?.attachment?.originalName
        ? { name: initialValues.attachment.originalName }
        : "",
    });
  }, [initialValues]);

  function handleUploadButtonClick() {
    fileInputRef.current.click();
  }

  const { isSubmitting, isDirty, isValid } = formState;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.root}>
      <div className={styles.content}>
        <Input
          name="title"
          ref={register}
          label="cím"
          placeholder="A kérdésed címe..."
          error={errors?.title?.message}
          disabled={skeleton || isSubmitting}
        />

        <Textarea
          name="body"
          ref={register}
          rows={7}
          label="törzs"
          placeholder="A kérdésed törzse..."
          error={errors?.body?.message}
          disabled={skeleton || isSubmitting}
        />

        <Controller
          name="topic"
          control={control}
          render={({ value, onChange, onBlur }) => (
            <Autocomplete
              label={`téma${isTopicNew ? " (újat fogsz létrehozni)" : ""}`}
              error={errors?.topic?.message}
              value={value ? { label: value, value } : null}
              onChange={(value) => {
                if (value) {
                  setIsTopicNew(false);
                  onChange(value.value);
                }
              }}
              onBlur={onBlur}
              disabled={skeleton || !data?.topics || isSubmitting}
              options={data?.topics?.map((e) => ({
                label: e.id,
                value: e.id,
              }))}
              onCreate={(newTopicName) => {
                setIsTopicNew(true);
                onChange(newTopicName);
              }}
              placeholder="A kérdésed témája..."
              noOptionsMessage={() => "Nincs még egy téma sem"}
              formatCreateLabel={(str) => `"${str}" téma létrehozása...`}
            />
          )}
        />

        {isTopicNew && (
          <Textarea
            label="új téma leírása"
            name="topicDescription"
            placeholder="Foglald össze miről szól az új témád..."
            rows={2}
            ref={register}
            error={errors?.topicDescription?.message}
            disabled={isSubmitting || skeleton}
          />
        )}

        <Controller
          name="file"
          control={control}
          render={({ value, onChange }) => (
            <div className={styles.fileWrapper}>
              <span
                className={cn(styles.fileLabel, {
                  [styles.active]: value?.name,
                })}
              >
                csatolmány
              </span>
              {value?.name ? (
                <div className={cn(styles.fileRow, styles.active)}>
                  <p className={styles.fileName}>{value.name}</p>
                  <Button
                    disabled={isSubmitting}
                    small
                    type="button"
                    onClick={() => {
                      fileInputRef.current.value = null;
                      onChange(
                        initialValues.attachment ? DELETE_CURRENT_FILE : ""
                      );
                    }}
                  >
                    Törlés
                  </Button>
                </div>
              ) : (
                <div className={styles.fileRow}>
                  <p>Még nem adtál hozzá csatolmányt</p>
                  <Button
                    disabled={isSubmitting || skeleton}
                    small
                    type="button"
                    onClick={handleUploadButtonClick}
                    className={styles.addButton}
                  >
                    Hozzádaás
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
                    onChange(e.target.files[0]);
                  }
                }}
              />
              {errors?.fileSize?.message && (
                <div className={styles.fileError}>
                  <Error>{errors.fileSize.message}</Error>
                </div>
              )}
            </div>
          )}
        />
      </div>
      <div className={styles.footer}>
        {message && <span>{message}</span>}
        <Button
          disabled={isSubmitting || !(isValid && isDirty) || skeleton}
          loading={isSubmitting}
          inverted
          type="submit"
        >
          {buttonText}
        </Button>
      </div>
    </form>
  );
}
