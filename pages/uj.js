import { useRouter } from "next/router";
import Form from "components/question-form";
import Layout from "components/layout";
import Head from "next/head";
import { useUser } from "lib/authenticate";
import styles from "styles/pages/ask.module.css";
import { mutate } from "swr";
import { useToasts } from "components/toasts";
import { trimSpaces, trimLineBreaks } from "lib/utils";

const AskPage = () => {
  const router = useRouter();
  const { user } = useUser("/belepes");
  const { addToast } = useToasts();
  const initialTopic = router.query.tema;

  const handleSubmit = async (values) => {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      const { id } = await res.json();
      const { title, body, ...rest } = values;
      mutate(
        `/api/question/${id}`,
        {
          question: {
            id,
            title: trimSpaces(title),
            body: trimLineBreaks(body),
            ...rest,
            answers: {
              count: 0,
              list: [],
            },
            upvotes: {
              count: 0,
              currentUserUpvoted: false,
            },
            creator: user.id,
            createdAt: Date.now(),
          },
        },
        false
      );

      return router.push(`/kerdes/[id]`, `/kerdes/${id}`);
    } else {
      addToast("Hiba lépett fel kérdésed beküldése közben", {
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
            buttonText="Küldés"
            onSubmit={handleSubmit}
            skeleton={!user}
            message="Később van lehetőség módosításokra."
            initialValues={{ topic: initialTopic }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default AskPage;
