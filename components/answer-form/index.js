import Textarea from "components/textarea";
import Button from "components/button";
import styles from "./answer-form.module.css";
import { Formik, Form, Field, ErrorMessage } from "formik";
import Error from "components/error";
import { getAnswerSchema } from "lib/schemas";

const validationSchema = getAnswerSchema();

export default function AnswerForm({ onSubmit }) {
  const handleSubmit = async (values, { resetForm }) => {
    await onSubmit(values);
    resetForm();
  };

  return (
    <Formik
      initialValues={{ body: "" }}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({ isSubmitting, isValid, dirty, errors, touched, values }) => (
        <Form className={styles.root}>
          <Field
            name="body"
            placeholder="Írd be a válaszod..."
            as={Textarea}
            maxRows={5}
            errored={errors.body && touched.body}
          />
          <ErrorMessage name="body">
            {(msg) => (
              <span className={styles.error}>
                <Error>{msg}</Error>
              </span>
            )}
          </ErrorMessage>
          <Button
            type="submit"
            disabled={isSubmitting || !(isValid && dirty)}
            loading={isSubmitting}
            inverted
            className={values.body ? styles.showOnMobile : null}
          >
            Válaszolás
          </Button>
        </Form>
      )}
    </Formik>
  );
}
