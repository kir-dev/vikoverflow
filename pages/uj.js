import { useRouter } from "next/router";
import Form from "components/question-form";
import Layout from "components/layout";
import Head from "next/head";
import { useUser } from "lib/authenticate";
import { useToasts } from "components/toasts";

const AskPage = () => {
  const router = useRouter();
  const { user } = useUser("/belepes");
  const { addToast } = useToasts();
  const initialTopics = router.query.temak
    ? [...new Set(router.query.temak.split(",").slice(0, 5))]
    : null;

  const handleSubmit = async (values) => {
    const formData = new FormData();

    for (const [key, value] of Object.entries(values)) {
      formData.append(key, key === "topics" ? JSON.stringify(value) : value);
    }

    const res = await fetch("/api/questions", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const { id } = await res.json();
      return router.push(`/kerdes/${id}`);
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

      <Form
        buttonText="Küldés"
        onSubmit={handleSubmit}
        skeleton={!user}
        message="Később van lehetőség módosításokra."
        initialValues={{ topics: initialTopics }}
      />
    </Layout>
  );
};

export default AskPage;
