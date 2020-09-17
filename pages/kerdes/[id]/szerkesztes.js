import { useRouter } from "next/router";
import Form from "components/question-form";
import useSWR from "swr";
import Layout from "components/layout";
import { useUser } from "lib/authenticate";
import Head from "next/head";
import { useEffect } from "react";
import styles from "styles/pages/ask.module.css";
import { useToasts } from "components/toasts";
import { trimSpaces, trimLineBreaks } from "lib/utils";

const QuestionEditPage = () => {
  const router = useRouter();
  const questionId = router.query.id;
  const { data, mutate } = useSWR(
    questionId ? `/api/questions/${questionId}` : null
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
    const formData = new FormData();

    for (let key of Object.keys(values)) {
      formData.append(key, values[key]);
    }

    const res = await fetch(`/api/questions/${questionId}`, {
      method: "PATCH",
      body: formData,
    });

    if (res.ok) {
      const { title, body, ...rest } = values;
      mutate(
        (oldData) => ({
          question: {
            ...oldData.question,
            title: trimSpaces(title),
            body: trimLineBreaks(body),
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
