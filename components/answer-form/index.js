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
      {({ isSubmitting, isValid, dirty, errors, touched }) => (
        <Form className={styles.root}>
          <Field
            name="body"
            placeholder="Küldd be saját válaszod a fenti kérdésre..."
            as={Textarea}
            errored={errors.body && touched.body}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !(isValid && dirty)}
            loading={isSubmitting}
            inverted
          >
            Válaszolás
          </Button>
          <ErrorMessage name="body">
            {(msg) => <Error>{msg}</Error>}
          </ErrorMessage>
        </Form>
      )}
    </Formik>
  );
}
