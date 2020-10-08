import { useRouter } from "next/router";
import useSWR from "swr";
import styles from "styles/pages/question.module.css";
import Avatar from "components/avatar";
import IconButton from "components/icon-button";
import Linkify from "components/linkify";
import Button from "components/button";
import Textarea from "components/textarea";
import { useUser } from "lib/authenticate";
import dayjs from "lib/dayjs";
import Layout from "components/layout";

export default function QuestionPage() {
  const router = useRouter();
  const questionId = router.query.id;
  const { data } = useSWR(questionId ? `/api/questions/${questionId}` : null);

  if (!data) {
    return null;
  }

  return (
    <Layout>
      <div className={styles.root}>
        <Question {...data.question} />

        {data.question.answers.list.map((a) => (
          <Answer {...a} />
        ))}

        <AnswerForm />
      </div>
    </Layout>
  );
}

function Question({
  title,
  body,
  attachment,
  upvotes,
  answers,
  topic,
  createdAt,
  creator,
}) {
  const router = useRouter();
  const { data: creatorData } = useSWR(creator ? `/api/user/${creator}` : null);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.creator}>
          <Avatar
            loading={!creatorData?.user}
            id={creatorData?.user?.avatar}
            size={32}
            onClick={() => router.push("/profil/[id]", `/profil/${creator}`)}
          />
          <div className={styles.creatorInfo}>
            <p>{creatorData?.user?.name}</p>
            <p>{dayjs(new Date(createdAt)).fromNow()}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <IconButton tooltip="Kérdés szerkesztése">
            <EditIcon />
          </IconButton>
          <IconButton tooltip="Kérdés törlése">
            <TrashIcon />
          </IconButton>
        </div>
      </div>

      <div className={styles.body}>
        <h1>{title}</h1>
        <p>
          <Linkify>{body}</Linkify>
        </p>
        {attachment && (
          <a
            href={`${process.env.NEXT_PUBLIC_S3_URL}/${attachment.s3Key}`}
            target="_blank"
            rel="noopener"
            className={styles.attachment}
          >
            <AttachmentIcon />
            <span>{attachment.originalName}</span>
          </a>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.actions}>
          <div className={styles.action}>
            <IconButton
              tooltip={`Eddig ${upvotes.count} embernek tetszett a kérdés`}
            >
              <HearthIcon />
            </IconButton>
            <span>{upvotes.count}</span>
          </div>
          <div className={styles.action}>
            <IconButton
              tooltip={`Eddig ${answers.count} válasz érkezett a kérdésre`}
            >
              <CommentIcon />
            </IconButton>

            <span>{answers.count}</span>
          </div>
        </div>
        <p className={styles.topic}>#{topic}</p>
      </div>
    </div>
  );
}

function Answer({ id, creator, createdAt, body, upvotes }) {
  const router = useRouter();
  const { data: creatorData } = useSWR(creator ? `/api/user/${creator}` : null);

  return (
    <div key={id} className={styles.container}>
      <div className={styles.header}>
        <div className={styles.creator}>
          <Avatar
            loading={!creatorData?.user}
            id={creatorData?.user?.avatar}
            size={32}
            onClick={() => router.push("/profil/[id]", `/profil/${creator}`)}
          />
          <div className={styles.creatorInfo}>
            <p>{creatorData?.user?.name}</p>
            <p>{dayjs(new Date(createdAt)).fromNow()}</p>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <p>{body}</p>
      </div>

      <div className={styles.footer}>
        <div className={styles.actions}>
          <div className={styles.action}>
            <IconButton
              tooltip={`Eddig ${upvotes.count} embernek tetszett a kérdés`}
            >
              <HearthIcon />
            </IconButton>
            <span>{upvotes.count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnswerForm() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const { data: userData } = useSWR(
    !isUserLoading ? `/api/user/${user.id}` : null
  );

  return (
    <form className={styles.answerForm}>
      <div className={styles.answerFormContent}>
        <Avatar
          loading={!userData?.user}
          id={userData?.user?.avatar}
          size={32}
          className={styles.avatar}
          onClick={() => router.push("/profil/[id]", `/profil/${user.id}`)}
        />
        <Textarea placeholder="Írd be a saját válaszod..." rows={5} />
      </div>
      <div className={styles.answerFormActions}>
        <Button>Küldés</Button>
      </div>
    </form>
  );
}

function EditIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.5 19H19.5C19.6326 19 19.7598 19.0527 19.8536 19.1464C19.9473 19.2402 20 19.3674 20 19.5C20 19.6326 19.9473 19.7598 19.8536 19.8536C19.7598 19.9473 19.6326 20 19.5 20H9.5C9.36739 20 9.24021 19.9473 9.14645 19.8536C9.05268 19.7598 9 19.6326 9 19.5C9 19.3674 9.05268 19.2402 9.14645 19.1464C9.24021 19.0527 9.36739 19 9.5 19Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.42001 16.03C4.17821 16.2722 4.02648 16.5897 3.99001 16.93L3.77001 18.95C3.76213 19.0241 3.77095 19.0991 3.7958 19.1694C3.82066 19.2397 3.86093 19.3036 3.91366 19.3563C3.96639 19.4091 4.03025 19.4493 4.10056 19.4742C4.17087 19.499 4.24585 19.5079 4.32001 19.5L6.34001 19.29C6.68157 19.2508 6.9993 19.0955 7.24001 18.85L18.7 7.39999C18.9809 7.11874 19.1387 6.73749 19.1387 6.33999C19.1387 5.94249 18.9809 5.56124 18.7 5.27999L18 4.57999C17.8606 4.4394 17.6947 4.3278 17.5119 4.25165C17.3291 4.1755 17.133 4.13629 16.935 4.13629C16.737 4.13629 16.5409 4.1755 16.3581 4.25165C16.1754 4.3278 16.0095 4.4394 15.87 4.57999L4.42001 16.02V16.03Z"
        stroke="currentColor"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.5 6H5.5C5.22386 6 5 6.22386 5 6.5C5 6.77614 5.22386 7 5.5 7H18.5C18.7761 7 19 6.77614 19 6.5C19 6.22386 18.7761 6 18.5 6Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 9H11V17H10V9ZM13 9H14V17H13V9Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.5 6.5H6.5V18C6.5 18.3978 6.65804 18.7794 6.93934 19.0607C7.22064 19.342 7.60218 19.5 8 19.5H16C16.3978 19.5 16.7794 19.342 17.0607 19.0607C17.342 18.7794 17.5 18.3978 17.5 18V6.5ZM8.5 6.5H15.5V5C15.5 4.60218 15.342 4.22064 15.0607 3.93934C14.7794 3.65804 14.3978 3.5 14 3.5H10C9.60218 3.5 9.22064 3.65804 8.93934 3.93934C8.65804 4.22064 8.5 4.60218 8.5 5V6.5Z"
        stroke="currentColor"
      />
    </svg>
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

function HearthIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.2584 5.74144L19.2586 5.7416C19.6521 6.13499 19.9643 6.60207 20.1774 7.11615C20.3904 7.63023 20.5 8.18124 20.5 8.73771C20.5 9.29417 20.3904 9.84518 20.1774 10.3593C19.9643 10.8733 19.6521 11.3404 19.2586 11.7338L19.2585 11.7339L18.3457 12.6467L11.9998 18.9926L5.65384 12.6467L4.74106 11.7339C3.94642 10.9393 3.5 9.8615 3.5 8.73771C3.5 7.61392 3.94642 6.53616 4.74106 5.74152C5.5357 4.94688 6.61346 4.50046 7.73725 4.50046C8.86104 4.50046 9.9388 4.94688 10.7334 5.74152L11.6462 6.6543C11.8415 6.84957 12.1581 6.84957 12.3533 6.6543L13.2661 5.74152L13.2662 5.74144C13.6596 5.34787 14.1267 5.03566 14.6407 4.82265C15.1548 4.60964 15.7058 4.5 16.2623 4.5C16.8188 4.5 17.3698 4.60964 17.8839 4.82265C18.3979 5.03566 18.865 5.34787 19.2584 5.74144Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.707 20.793C11.5671 20.9328 11.389 21.028 11.195 21.0666C11.0011 21.1052 10.8 21.0853 10.6173 21.0097C10.4346 20.934 10.2785 20.8059 10.1686 20.6415C10.0587 20.477 10 20.2838 10 20.086V18H5C4.46957 18 3.96086 17.7893 3.58579 17.4142C3.21071 17.0391 3 16.5304 3 16V6C3 5.46957 3.21071 4.96086 3.58579 4.58579C3.96086 4.21071 4.46957 4 5 4H19C19.5304 4 20.0391 4.21071 20.4142 4.58579C20.7893 4.96086 21 5.46957 21 6V16C21 16.5304 20.7893 17.0391 20.4142 17.4142C20.0391 17.7893 19.5304 18 19 18H14.5L11.707 20.793ZM11 20.086L14.086 17H19C19.2652 17 19.5196 16.8946 19.7071 16.7071C19.8946 16.5196 20 16.2652 20 16V6C20 5.73478 19.8946 5.48043 19.7071 5.29289C19.5196 5.10536 19.2652 5 19 5H5C4.73478 5 4.48043 5.10536 4.29289 5.29289C4.10536 5.48043 4 5.73478 4 6V16C4 16.2652 4.10536 16.5196 4.29289 16.7071C4.48043 16.8946 4.73478 17 5 17H11V20.086Z"
        fill="currentColor"
      />
    </svg>
  );
}
