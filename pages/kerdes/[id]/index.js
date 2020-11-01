import { useRouter } from "next/router";
import useSWR from "swr";
import styles from "styles/pages/question.module.css";
import { useUser } from "lib/authenticate";
import Layout from "components/layout";
import { useRef, useEffect } from "react";
import AnswerForm from "components/answer-form";
import Answer from "components/answer";
import Question from "components/question";

export default function QuestionPage() {
  const { user } = useUser();
  const router = useRouter();
  const questionId = router.query.id;
  const { data } = useSWR(questionId ? `/api/questions/${questionId}` : null);
  const answerFormRef = useRef(null);

  function handleCommentButtonClick() {
    answerFormRef?.current?.scrollIntoView();
    answerFormRef?.current?.focus();
  }

  useEffect(() => {
    if (!data) return;

    if (!data.question) {
      router.push("/404");
    }
  }, [data]);

  if (!data) {
    return (
      <Layout>
        <div className={styles.root}>
          <Question skeleton />
          <Answer skeleton />
          <Answer skeleton />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.root}>
        <Question
          onCommentButtonClick={handleCommentButtonClick}
          {...data.question}
        />

        {data.question.answers.list.map((a) => (
          <Answer questionId={questionId} {...a} />
        ))}

        {user && <AnswerForm ref={answerFormRef} questionId={questionId} />}
      </div>
    </Layout>
  );
}
