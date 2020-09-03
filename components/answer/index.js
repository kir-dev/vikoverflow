import styles from "./answer.module.css";
import { ThumbsUp } from "react-feather";
import Textarea from "components/textarea";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { getAnswerSchema } from "lib/schemas";
import Error from "components/error";
import Button from "components/button";
import cn from "classnames";
import Avatar from "components/avatar";
import useSWR from "swr";
import { useRouter } from "next/router";
import { formatDistanceToNowStrict } from "date-fns";
import { hu } from "date-fns/locale";
import Linkify from "components/linkify";

const validationSchema = getAnswerSchema(true);

export default function Answer({
  body,
  upvotes,
  creator,
  createdAt,
  actions,
  editing,
  onCancelEdit,
  onEdit,
  allowActions,
  onUpvoteClick,
}) {
  const { data } = useSWR(creator ? `/api/user/${creator}` : null);
  const router = useRouter();

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
            <div
              className={cn(styles.root, {
                [styles.allowActions]: allowActions,
              })}
            >
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
                  <span className={styles.stat}>
                    <span
                      onClick={allowActions && onUpvoteClick}
                      className={cn(styles.statIcon, styles.action, {
                        [styles.fill]: upvotes?.currentUserUpvoted,
                      })}
                    >
                      <ThumbsUp size={16} />
                    </span>
                    <span className={styles.statCount}>{upvotes?.count}</span>
                  </span>
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
    <div className={cn(styles.root, { [styles.allowActions]: allowActions })}>
      <div className={styles.content}>
        <p>
          <Linkify>{body}</Linkify>
        </p>
      </div>
      <div className={styles.footer}>
        <span className={styles.stats}>
          <span className={styles.stat}>
            <span
              onClick={allowActions && onUpvoteClick}
              className={cn(styles.statIcon, styles.action, {
                [styles.fill]: upvotes?.currentUserUpvoted,
              })}
            >
              <ThumbsUp size={16} />
            </span>
            <span className={styles.statCount}>{upvotes?.count}</span>
          </span>
        </span>
        {actions ? (
          <span className={styles.actions}>{actions}</span>
        ) : (
          <>
            <Avatar
              loading={!data?.user}
              id={data?.user?.avatar}
              className={styles.avatar}
              size={24}
              onClick={() => router.push("/profil/[id]", `/profil/${creator}`)}
            />
            {createdAt && (
              <span className={styles.date}>
                {`· ${formatDistanceToNowStrict(new Date(createdAt), {
                  locale: hu,
                  addSuffix: true,
                })}`}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
