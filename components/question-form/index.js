import styles from "./question-form.module.css";
import Button from "components/button";
import { Formik, Form, Field, ErrorMessage } from "formik";
import Input from "components/input";
import Textarea from "components/textarea";
import StyledError from "components/error";
import useSWR from "swr";
import { useState, useMemo } from "react";
import Autocomplete from "components/autocomplete";
import { getQuestionSchema } from "lib/schemas";

const QuestionForm = ({
  initialValues,
  onSubmit,
  message,
  buttonText,
  skeleton,
}) => {
  const [isTopicNew, setIsTopicNew] = useState(false);
  const { data } = useSWR("/api/topics");
  const validationSchema = useMemo(() => getQuestionSchema(isTopicNew), [
    isTopicNew,
  ]);

  const mappedInitialValues = {
    title: initialValues?.title ?? "",
    body: initialValues?.body ?? "",
    topic: data?.topics?.find((e) => e.id === initialValues?.topic)
      ? initialValues.topic
      : "",
  };

  // iff onSubmit is async, then Formik will automatically
  // set isSubmitting to false once it has resolved.
  async function handleSubmit(values) {
    await onSubmit(values);
  }

  return (
    <Formik
      enableReinitialize
      initialValues={mappedInitialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({
        isSubmitting,
        isValid,
        dirty,
        errors,
        touched,
        values,
        setFieldValue,
        setFieldTouched,
      }) => (
        <Form className={styles.root}>
          <div className={styles.content}>
            <label>
              <span>cím</span>
              <Field
                as={Input}
                name="title"
                placeholder="A kérdésed címe..."
                errored={errors.title && touched.title}
                disabled={skeleton}
              />
            </label>
            <Error name="title" />

            <label>
              <span>törzs</span>
              <Field
                as={Textarea}
                name="body"
                placeholder="A kérdésed törzse..."
                minRows={7}
                errored={errors.body && touched.body}
                disabled={skeleton}
              />
            </label>
            <Error name="body" />

            <label>
              <span>téma {isTopicNew ? "(újat fogsz létrehozni)" : ""}</span>
              <Autocomplete
                value={
                  values.topic
                    ? { label: values.topic ?? "", label: values.topic ?? "" }
                    : null
                }
                onChange={(value) => {
                  if (value) {
                    setIsTopicNew(false);
                    setFieldValue("topic", value.value);
                  }
                }}
                onBlur={() => setFieldTouched("topic", true)}
                disabled={skeleton || !data?.topics}
                errored={errors.topic && touched.topic}
                options={data?.topics?.map((e) => ({
                  label: e.id,
                  value: e.id,
                }))}
                onCreate={(newTopicName) => {
                  setIsTopicNew(true);
                  setFieldValue("topic", newTopicName);
                }}
                placeholder="A kérdésed témája..."
                noOptionsMessage={() => "Nincs még egy téma sem"}
                formatCreateLabel={(str) => `"${str}" téma létrehozása...`}
              />
            </label>
            {touched.topic && errors.topic && (
              <>
                <span className={styles.gap} />
                <StyledError>{errors.topic}</StyledError>
              </>
            )}

            {isTopicNew && (
              <>
                <label>
                  <span>új téma leírása</span>
                  <Field
                    as={Textarea}
                    name="topicDescription"
                    placeholder="Foglald össze miről szól az új témád..."
                    minRows={3}
                    errored={
                      errors.topicDescription && touched.topicDescription
                    }
                    disabled={skeleton}
                  />
                </label>
                <Error name="topicDescription" />
              </>
            )}
          </div>
          <div className={styles.footer}>
            {message && <span>{message}</span>}
            <Button
              disabled={isSubmitting || !(isValid && dirty) || skeleton}
              loading={isSubmitting}
              inverted
              type="submit"
            >
              {buttonText}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

const Error = ({ name }) => (
  <ErrorMessage name={name}>
    {(msg) => (
      <>
        <span className={styles.gap} />
        <StyledError>{msg}</StyledError>
      </>
    )}
  </ErrorMessage>
);

export default QuestionForm;
