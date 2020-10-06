import styles from "./answer.module.css";
import { ThumbsUp } from "react-feather";
import Textarea from "components/textarea";
import { getAnswerSchema } from "lib/schemas";
import Button from "components/button";
import cn from "clsx";
import Avatar from "components/avatar";
import useSWR from "swr";
import { useRouter } from "next/router";
import { formatDistanceToNowStrict } from "date-fns";
import { hu } from "date-fns/locale";
import Linkify from "components/linkify";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup/yup";
import { useEffect } from "react";

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
  const { register, handleSubmit, formState, errors, reset } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: { body },
    mode: "onChange",
  });
  const { isDirty, isValid, isSubmitting } = formState;

  useEffect(() => {
    reset({ body });
  }, [body]);

  async function onSubmit(values) {
    await onEdit(values);
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn(styles.root, {
          [styles.allowActions]: allowActions,
        })}
      >
        <div className={styles.content}>
          <Textarea
            rows={3}
            name="body"
            disabled={isSubmitting}
            ref={register}
            placeholder="Küldd be saját válaszod a fenti kérdésre..."
            error={errors?.body?.message}
          />
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
              disabled={isSubmitting || !(isValid && isDirty)}
              loading={isSubmitting}
              type="submit"
            >
              Szerkesztés
            </Button>
          </span>
        </div>
      </form>
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
