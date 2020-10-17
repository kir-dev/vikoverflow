import styles from "./question-form.module.css";
import Button, { KIND } from "components/button";
import Input from "components/input";
import Textarea from "components/textarea";
import useSWR from "swr";
import { useState, useMemo, useRef, useEffect } from "react";
import Autocomplete from "components/autocomplete";
import { getQuestionSchema } from "lib/schemas";
import { DELETE_CURRENT_FILE } from "lib/constants";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Error from "components/error";

export default function QuestionForm({
  initialValues,
  onSubmit,
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
    watch,
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const watchFile = watch("file");

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
            rows={7}
            label="Törzs"
            placeholder="A kérdésed törzse..."
            error={errors?.body?.message}
            disabled={skeleton || isSubmitting}
          />

          <Controller
            name="topic"
            control={control}
            render={({ value, onChange, onBlur }) => (
              <Autocomplete
                label={`Téma${isTopicNew ? " (újat fogsz létrehozni)" : ""}`}
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
              label="Új téma leírása"
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
                <AttachmentIcon />
              </Button>
              {errors?.fileSize?.message && (
                <div className={styles.fileError}>
                  <Error>{errors.fileSize.message}</Error>
                </div>
              )}
            </div>
            <Button
              disabled={isSubmitting || !(isValid && isDirty) || skeleton}
              loading={isSubmitting}
              inverted
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

function AttachmentIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.491 5.95462C13.1048 5.35156 13.9283 5.00952 14.7887 5.0002C15.6492 4.99087 16.4798 5.315 17.1066 5.90462C17.7333 6.49425 18.1075 7.3036 18.1506 8.16301C18.1938 9.02243 17.9026 9.86519 17.338 10.5146L17.198 10.6626L12.374 15.4876C11.9781 15.8763 11.448 16.098 10.8932 16.1069C10.3384 16.1157 9.80144 15.9111 9.39332 15.5352C8.9852 15.1593 8.73714 14.6409 8.70042 14.0873C8.6637 13.5337 8.84113 12.9871 9.19603 12.5606L9.31603 12.4306L12.641 9.10462C12.7299 9.01889 12.8473 8.96901 12.9708 8.96455C13.0942 8.96009 13.2149 9.00137 13.3097 9.08047C13.4046 9.15956 13.4669 9.2709 13.4846 9.39311C13.5024 9.51532 13.4744 9.63979 13.406 9.74262L13.349 9.81262L10.024 13.1376C9.80773 13.3454 9.68035 13.629 9.66861 13.9287C9.65688 14.2284 9.7617 14.5211 9.96109 14.7452C10.1605 14.9693 10.4389 15.1074 10.738 15.1306C11.037 15.1538 11.3335 15.0603 11.565 14.8696L11.666 14.7796L16.491 9.95462C16.9188 9.52907 17.1647 8.95403 17.1768 8.35074C17.1888 7.74745 16.9662 7.16303 16.5557 6.72071C16.1453 6.27838 15.5792 6.01269 14.9767 5.97965C14.3742 5.94662 13.7824 6.14882 13.326 6.54362L13.199 6.66262L7.02403 12.8376C6.37284 13.4786 5.99863 14.3491 5.98159 15.2626C5.96456 16.1762 6.30606 17.0601 6.9329 17.7248C7.55975 18.3896 8.42206 18.7824 9.33503 18.819C10.248 18.8556 11.139 18.5331 11.817 17.9206L11.967 17.7806L15.641 14.1046C15.7299 14.0189 15.8473 13.969 15.9708 13.9645C16.0942 13.9601 16.2149 14.0014 16.3097 14.0805C16.4046 14.1596 16.4668 14.2709 16.4846 14.3931C16.5024 14.5153 16.4744 14.6398 16.406 14.7426L16.349 14.8126L12.674 18.4876C11.8308 19.3305 10.6873 19.8039 9.49503 19.8039C8.30278 19.8039 7.15932 19.3305 6.31603 18.4876C5.50161 17.6726 5.03107 16.5761 5.00148 15.4243C4.9719 14.2726 5.38553 13.1534 6.15703 12.2976L6.31703 12.1296L12.491 5.95462Z"
        fill="currentColor"
      />
    </svg>
  );
}

function X() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.14689 5.14689C5.19334 5.10033 5.24851 5.06339 5.30926 5.03818C5.37001 5.01297 5.43513 5 5.50089 5C5.56666 5 5.63178 5.01297 5.69253 5.03818C5.75327 5.06339 5.80845 5.10033 5.85489 5.14689L12.0009 11.2939L18.1469 5.14689C18.2297 5.06422 18.339 5.01323 18.4556 5.00282C18.5722 4.9924 18.6887 5.02322 18.7849 5.08989L18.8549 5.14689C18.9015 5.19334 18.9384 5.24851 18.9636 5.30926C18.9888 5.37001 19.0018 5.43513 19.0018 5.50089C19.0018 5.56666 18.9888 5.63178 18.9636 5.69253C18.9384 5.75327 18.9015 5.80845 18.8549 5.85489L12.7079 12.0009L18.8549 18.1469C18.9376 18.2297 18.9886 18.339 18.999 18.4556C19.0094 18.5722 18.9786 18.6887 18.9119 18.7849L18.8549 18.8549C18.8084 18.9015 18.7533 18.9384 18.6925 18.9636C18.6318 18.9888 18.5667 19.0018 18.5009 19.0018C18.4351 19.0018 18.37 18.9888 18.3093 18.9636C18.2485 18.9384 18.1933 18.9015 18.1469 18.8549L12.0009 12.7079L5.85489 18.8549C5.77204 18.9376 5.6628 18.9886 5.54622 18.999C5.42964 19.0094 5.31309 18.9786 5.21689 18.9119L5.14689 18.8549C5.10033 18.8084 5.06339 18.7533 5.03818 18.6925C5.01297 18.6318 5 18.5667 5 18.5009C5 18.4351 5.01297 18.37 5.03818 18.3093C5.06339 18.2485 5.10033 18.1933 5.14689 18.1469L11.2939 12.0009L5.14689 5.85489C5.06422 5.77204 5.01323 5.6628 5.00282 5.54622C4.9924 5.42964 5.02322 5.31309 5.08989 5.21689L5.14689 5.14689Z"
        fill="currentColor"
      />
    </svg>
  );
}
