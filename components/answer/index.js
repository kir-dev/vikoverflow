import styles from "./answer.module.css";
import { ThumbsUp } from "react-feather";
import Textarea from "components/textarea";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { getAnswerSchema } from "lib/schemas";
import Error from "components/error";
import Button from "components/button";

const validationSchema = getAnswerSchema(true);

export default function Answer({
  body,
  upvotes,
  actions,
  editing,
  onCancelEdit,
  onEdit,
}) {
  async function handleSubmit(values) {
    await onEdit(values);
  }

  if (editing) {
    return (
      <Formik
        initialValues={{ body }}
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
      >
        {({ errors, touched, isSubmitting, isValid, dirty }) => (
          <Form>
            <div className={styles.root}>
              <div className={styles.content}>
                <Field
                  minRows={3}
                  disabled={isSubmitting}
                  name="body"
                  placeholder="Küldd be saját válaszod a fenti kérdésre..."
                  as={Textarea}
                  errored={errors.body && touched.body}
                />
                <ErrorMessage name="body">
                  {(msg) => (
                    <span className={styles.error}>
                      <Error>{msg}</Error>
                    </span>
                  )}
                </ErrorMessage>
              </div>
              <div className={styles.footer}>
                <span className={styles.stats}>
                  <ThumbsUp size={18} />
                  {upvotes.count}
                </span>
                <span className={styles.actions}>
                  <Button
                    small
                    onClick={onCancelEdit}
                    disabled={isSubmitting}
                    type="button"
                  >
                    Mégsem
                  </Button>
                  <Button
                    small
                    inverted
                    disabled={isSubmitting || !(isValid && dirty)}
                    loading={isSubmitting}
                    type="submit"
                  >
                    Szerkesztés
                  </Button>
                </span>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <p>{body}</p>
      </div>
      <div className={styles.footer}>
        <span className={styles.stats}>
          <ThumbsUp size={18} />
          {upvotes.count}
        </span>
        <span className={styles.actions}>{actions}</span>
      </div>
    </div>
  );
}
