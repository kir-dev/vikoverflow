import styles from "./question-form.module.css";
import Button, { KIND } from "components/button";
import Input from "components/input";
import Textarea from "components/textarea";
import useSWR from "swr";
import { useRef, useEffect } from "react";
import Autocomplete from "components/autocomplete";
import { QuestionSchema } from "lib/schemas";
import { DELETE_CURRENT_FILE } from "lib/constants";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Error from "components/error";
import { Attachment, X } from "components/icons";

export default function QuestionForm({
  initialValues,
  onSubmit,
  buttonText,
  skeleton,
}) {
  const { data } = useSWR("/api/topics");
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
    watch,
  } = useForm({
    defaultValues: {
      title: "",
      body: "",
      topics: [],
      file: "",
    },
    resolver: yupResolver(QuestionSchema, { abortEarly: true }),
    mode: "onChange",
  });

  const watchFile = watch("file");

  useEffect(() => {
    reset({
      title: initialValues?.title ?? "",
      body: initialValues?.body ?? "",
      topics: initialValues?.topics ?? [],
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
    <div className={styles.page}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.root}>
        <div className={styles.content}>
          <Input
            name="title"
            ref={register}
            label="Cím"
            placeholder="A kérdésed címe..."
            error={errors?.title?.message}
            disabled={skeleton || isSubmitting}
          />

          <Textarea
            name="body"
            ref={register}
            rows={10}
            label="Törzs"
            placeholder="A kérdésed törzse..."
            error={errors?.body?.message}
            disabled={skeleton || isSubmitting}
          />

          <Controller
            name="topics"
            control={control}
            render={({ value, onChange, onBlur }) => (
              <Autocomplete
                label="Témák"
                error={
                  errors?.topics?.message ||
                  (errors?.topics?.length &&
                    errors.topics.map((t, i) => (
                      <p>{`${value[i]}: ${t.message}`}</p>
                    )))
                }
                value={value?.map((e) => ({ label: e, value: e }))}
                onChange={(newValue) => {
                  onChange(newValue ? newValue.map((e) => e.value) : []);
                }}
                onBlur={onBlur}
                disabled={skeleton || !data?.topics || isSubmitting}
                options={data?.topics?.map((e) => ({
                  label: e.id,
                  value: e.id,
                }))}
                onCreate={(newTopicName) => {
                  onChange([...value, newTopicName]);
                }}
                placeholder="A kérdésed témái..."
                noOptionsMessage={() => "Nincs még egy téma sem"}
                formatCreateLabel={(str) => `"${str}" téma létrehozása...`}
                isMulti
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
                          initialValues.attachment ? DELETE_CURRENT_FILE : ""
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

          <div className={styles.submitRow}>
            <div className={styles.fileButtonContainer}>
              <Button
                kind={KIND.icon}
                type="button"
                onClick={handleUploadButtonClick}
                tooltip="Csatolmány hozzáadása"
                disabled={watchFile && watchFile !== DELETE_CURRENT_FILE}
              >
                <Attachment />
              </Button>
              {errors?.fileSize?.message && (
                <div className={styles.fileError}>
                  <Error>{errors.fileSize.message}</Error>
                </div>
              )}
            </div>
            <Button
              disabled={isSubmitting || !(isValid && isDirty) || skeleton}
              type="submit"
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
