import { useRouter } from "next/router";
import useSWR from "swr";
import styles from "styles/pages/question.module.css";
import { useUser } from "lib/authenticate";
import Layout from "components/layout";
import { useEffect } from "react";
import AnswerForm from "components/answer-form";
import Answer from "components/answer";
import Question from "components/question";

export default function QuestionPage() {
  const { user } = useUser();
  const router = useRouter();
  const questionId = router.query.id;
  const { data } = useSWR(questionId ? `/api/questions/${questionId}` : null);

  useEffect(() => {
    if (!data) return;

    if (!data.question) {
      router.push("/404");
    }
  }, [data]);

  if (!data?.question) {
    return (
      <Layout footerDark>
        <div className={styles.root}>
          <Question skeleton />
          <AnswerForm skeleton />
          <Answer skeleton />
          <Answer skeleton />
        </div>
      </Layout>
    );
  }

  return (
    <Layout footerDark>
      <div className={styles.root}>
        <Question {...data.question} />

        {user && <AnswerForm questionId={questionId} />}

        {data.question.answers.list.map((a) => (
          <Answer questionId={questionId} {...a} />
        ))}
      </div>
    </Layout>
  );
}
