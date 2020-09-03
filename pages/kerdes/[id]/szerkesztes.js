import { useRouter } from "next/router";
import Form from "components/question-form";
import useSWR from "swr";
import Layout from "components/layout";
import { useUser } from "lib/authenticate";
import Head from "next/head";
import { useEffect } from "react";
import styles from "styles/pages/ask.module.css";
import { useToasts } from "components/toasts";

const QuestionEditPage = () => {
  const router = useRouter();
  const questionId = router.query.id;
  const { data, mutate } = useSWR(
    questionId ? `/api/question/${questionId}` : null
  );
  const { user } = useUser("/belepes");
  const { addToast } = useToasts();

  const loading = !(user && data);

  useEffect(() => {
    if (loading) return;

    if (!data.question || data.question.creator !== user.id) {
      router.push("/404");
    }
  }, [user, data]);

  const handleSubmit = async (values) => {
    const res = await fetch(`/api/question/${questionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      const { title, body, ...rest } = values;
      mutate(
        (oldData) => ({
          question: {
            ...oldData.question,
            title: title.trim().replace(/\s\s+/g, " "),
            body: body.trim().replace(/\n\s*\n\s*\n/g, '\n\n'),
            ...rest,
          },
        }),
        false
      );
      addToast("A kérdésed sikeresen szerkesztve.");
      return router.push(`/kerdes/[id]`, `/kerdes/${questionId}`);
    } else {
      addToast("Hiba lépett fel kérdésed szerkesztése közben", {
        errored: true,
      });
    }
  };

  return (
    <Layout>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            if (document.cookie.indexOf("logged-in=") === -1) {
              window.location.replace('/belepes')
            }
          `,
          }}
        />
      </Head>

      <div className={styles.root}>
        <div className={styles.inner}>
          <Form
            initialValues={data?.question}
            onSubmit={handleSubmit}
            buttonText="Szerkesztés"
            skeleton={loading}
          />
        </div>
      </div>
    </Layout>
  );
};

export default QuestionEditPage;
